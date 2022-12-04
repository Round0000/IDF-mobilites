const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const url =
  "https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:45102:";
const apiKey = "kg04GTyBX5uPsC9JT4YffEOJrIKHfanN";
//
const app = express();
const port = process.env.PORT || 3030;

const options = {
  method: "GET",
  headers: { Accept: "application/json", apikey: apiKey },
};

function getChateletRerB(res) {
  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      const results = [];
      json.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(
        (item) => {
          if (
            item.MonitoredVehicleJourney.LineRef.value !== "STIF:Line::C01743:"
          ) return;
          if (!item.MonitoredVehicleJourney.DirectionName[0].value.includes('AEROPORT')) return;
          const time = new Date(
            item.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime
          );
          time.setHours(time.getHours() + 1);
          const data = {
            time: time.toLocaleTimeString('fr-FR'),
            destination:
              item.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0]
                .value,
            code: item.MonitoredVehicleJourney.JourneyNote[0].value,
          };
          results.push(data);
          return data;
        }
      );
      const sortedResults = results.sort((a, b) => new Date(a.time) - new Date(b.time));
      res.set('Content-Type', 'text/html');

      let content = '';
      sortedResults.forEach(el => content += '<strong>' + el.time + '</strong> - <em>' + el.code + '</em> - ' + el.destination + '<br><br>' );
      
      res.send(Buffer.from(`<div style="font-family: Roboto, sans-serif;"><h3>Châtelet vers CDG/Mitry</h3>${content}</div>`));
      // res.send(results.sort((a, b) => a.time - b.time));
      return results.sort((a, b) => a.time - b.time);
    })
    .catch((err) => console.error("error:" + err));
}

app.get("/", (req, res) => {

  getChateletRerB(res);

});

app.listen(port, () => {
  console.log("listening on port " + port);
});
