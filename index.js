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

function getChateletRerB() {
  fetch(url, options)
    .then((res) => res.json())
    .then((json) => {
      const results = [];
      json.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(
        (item) => {
          if (
            item.MonitoredVehicleJourney.LineRef.value !== "STIF:Line::C01743:"
          )
            return;
          const data = {
            time: new Date(
              item.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime
            ).toLocaleTimeString("fr-FR"),
            destination:
              item.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0]
                .value,
            code: item.MonitoredVehicleJourney.JourneyNote[0].value,
          };
          results.push(data);
          return data;
        }
      );
      console.log(results.sort((a, b) => a.time - b.time))
      return results.sort((a, b) => a.time - b.time);
    })
    .catch((err) => console.error("error:" + err));
}

app.get("/", (req, res) => {
  res.send(getChateletRerB());
});

app.listen(port, () => {
  console.log("listening on port " + port);
});
