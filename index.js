const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const urlChatelet =
  "https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:45102:";
const urlCDG =
  "https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:462398:";
const apiKey = "kg04GTyBX5uPsC9JT4YffEOJrIKHfanN";
//
const app = express();
const port = process.env.PORT || 3030;

const options = {
  method: "GET",
  headers: { Accept: "application/json", apikey: apiKey },
};

function getChateletRerB(res) {
  fetch(urlChatelet, options)
    .then((res) => res.json())
    .then((json) => {
      res.set("Content-Type", "text/html");

      const results = [];

      json.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(
        (item) => {
          if (
            item.MonitoredVehicleJourney.LineRef?.value !== "STIF:Line::C01743:"
          )
            return;

          const directionName =
            item.MonitoredVehicleJourney.DirectionName[0]?.value;
          if (
            !directionName.includes("AEROPORT") &&
            !directionName.includes("Aéro")
          )
            return;
          if (
            item.MonitoredVehicleJourney.MonitoredCall.DepartureStatus ===
            "cancelled"
          )
            return;

          let time = new Date(
            item.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime
          );

          if (new Date() > time) return;

          const timeFormatter = Intl.DateTimeFormat("fr-FR", {
            timeZone: "Europe/Paris",
            timeStyle: "medium",
          });
          time = timeFormatter.format(time);

          const destination =
            item.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0]?.value.slice(
              0,
              26
            ) + " ...";

          console.log(destination);

          const data = {
            time: time,
            destination: destination,
            code: item.MonitoredVehicleJourney.JourneyNote[0]?.value,
          };
          results.push(data);
          return data;
        }
      );

      const sortedResults = results.sort(
        (a, b) => new Date(a.time) - new Date(b.time)
      );

      let content = "";
      sortedResults.forEach(
        (el) =>
          (content +=
            '<strong style="font-size: 1.25rem;">' +
            el.time +
            "</strong> - <em>" +
            el.code +
            "</em> - " +
            el.destination +
            "<br><br>")
      );

      if (content?.length) {
        res.send(
          Buffer.from(
            `<div style="font-family: Roboto, sans-serif;"><h3>Châtelet vers CDG/Mitry</h3>${content}</div>`
          )
        );
      } else {
        res.send(
          Buffer.from(
            `<div style="font-family: Roboto, sans-serif;"><h3>Châtelet vers CDG/Mitry</h3>Je ne dirais pas que c'est un échec : ça n'a pas marché...</div>`
          )
        );
      }
      // res.send(results.sort((a, b) => a.time - b.time));
      console.table(results);
      return results.sort((a, b) => a.time - b.time);
    })
    .catch((err) => console.error("error:" + err));
}

function getCDGRerB(res) {
  fetch(urlCDG, options)
    .then((res) => res.json())
    .then((json) => {
      const results = [];
      json.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(
        (item) => {
          if (
            item.MonitoredVehicleJourney.LineRef?.value !== "STIF:Line::C01743:"
          )
            return;
          if (
            item.MonitoredVehicleJourney.DestinationName[0]?.value.includes(
              "CDG"
            )
          )
            return;
          if (
            item.MonitoredVehicleJourney.MonitoredCall.DepartureStatus ===
            "cancelled"
          )
            return;

          let time = new Date(
            item.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime
          );

          if (new Date() > time) return;

          const timeFormatter = Intl.DateTimeFormat("fr-FR", {
            timeZone: "Europe/Paris",
            timeStyle: "medium",
          });
          time = timeFormatter.format(time);

          let destination =
            item.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0]
              ?.value;

          console.log(destination);

          if (destination) {
            destination = destination.slice(0, 22) + "...";
          } else {
            return;
          }

          if (
            destination.includes("Aéroport") ||
            destination.includes("AERO")
          ) {
            return;
          }

          const data = {
            time: time,
            destination: destination,
            code: item.MonitoredVehicleJourney.JourneyNote[0]?.value,
            platform:
              item.MonitoredVehicleJourney.MonitoredCall.ArrivalPlatformName
                ?.value || "??",
          };
          results.push(data);
          return data;
        }
      );
      const sortedResults = results.sort(
        (a, b) => new Date(a.time) - new Date(b.time)
      );
      sortedResults.length = 8;
      res.set("Content-Type", "text/html");

      let content = "";
      sortedResults.forEach(
        (el) =>
          (content +=
            '<strong style="font-size: 1.25rem;">' +
            el.time +
            "</strong> -<em>" +
            el.platform +
            "- " +
            el.code +
            "</em> " +
            el.destination +
            "<br><br>")
      );

      if (content?.length) {
        res.send(
          Buffer.from(
            `<div style="font-family: Roboto, sans-serif;"><h3>CDG Roissypôle vers le sud</h3>${content}</div>`
          )
        );
      } else {
        res.send(
          Buffer.from(
            `<div style="font-family: Roboto, sans-serif;"><h3>CDG Roissypôle vers le sud</h3>Je ne dirais pas que c'est un échec : ça n'a pas marché...</div>`
          )
        );
      }

      // res.send(results.sort((a, b) => a.time - b.time));
      console.table(results);
      return results.sort((a, b) => a.time - b.time);
    })
    .catch((err) => console.error("error:" + err));
}

app.get("/chatelet", (req, res) => {
  getChateletRerB(res);
});

app.get("/cdg", (req, res) => {
  getCDGRerB(res);
});

app.listen(port, () => {
  console.log("listening on port " + port);
});
