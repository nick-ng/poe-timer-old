require("dotenv").config();
const express = require("express");
const http = require("http");
const compression = require("compression");
const path = require("path");
const socketio = require("socket.io");
const Tail = require("always-tail2");
const moment = require("moment");
const fs = require("fs");

const { applyMiddlewares } = require("./middleware");
const { applyRouters } = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio();

io.on("connection", (socket) => {
  console.log("a user connected");
});

const lineHandler = (line) => {
  io.emit("clientLine", line);
};

const standAloneLog = ".\\sa-client.txt";
const steamLog = ".\\steam-client.txt";

const tailSA = new Tail(standAloneLog, "\n", { interval: 499 });
const tailSteam = new Tail(steamLog, "\n", { interval: 499 });

tailSA.on("line", lineHandler);
tailSteam.on("line", lineHandler);

const router = express.Router();

app.use(compression());
app.use(express.json());

applyMiddlewares(app);
applyRouters(router);
router.get("/clienttxt", (req, res, next) => {
  try {
    const { start } = req.query;
    const sa = fs.readFileSync(standAloneLog, { encoding: "utf-8" });
    const steam = fs.readFileSync(steamLog, { encoding: "utf-8" });
    const sab = sa.split("\n");
    const steamb = steam.split("\n");
    sab
      .concat(steamb)
      .sort()
      .filter((line) => {
        if (!start) {
          return true;
        }

        const dateMatches = line.match(
          /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/
        );
        if (!dateMatches || dateMatches.length === 0) {
          return false;
        }
        const dateString = dateMatches[0];
        const date = moment(dateString, "YYYY/MM/DD HH:mm:ss");
        timestamp = date.valueOf();
        if (parseInt(start, 10) <= timestamp) {
          return true;
        }

        return false;
      })
      .slice(-10000)
      .forEach(lineHandler);
    res.sendStatus(200);
  } catch (e) {
    console.log("error when reading files.", e);
    res.sendStatus(500);
  }
});

app.use(router);

// serve static files
app.use(express.static("assets"));
app.use(express.static("dist"));

// redirect all requests to index.html
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

// starting listening
const port = process.env.PORT || 3000;
server.listen(port, () =>
  console.log(`${new Date()} Website server listening on ${port}.`)
);

io.listen(3001);
