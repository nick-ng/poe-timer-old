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

const lineHandler = (line, i) => {
  setTimeout(() => {
    io.emit("clientLine", line);
  }, 20 * i);
};

const standAloneLogPath = ".\\sa-client.txt";
const steamLogPath = ".\\steam-client.txt";
const linuxLogPath = "./steam-client/Client.txt";

if (fs.existsSync(standAloneLogPath)) {
  const tailSA = new Tail(standAloneLogPath, "\n", { interval: 499 });
  tailSA.on("line", lineHandler);
}

if (fs.existsSync(steamLogPath)) {
  const tailSteam = new Tail(steamLogPath, "\n", { interval: 499 });
  tailSteam.on("line", lineHandler);
}

if (fs.existsSync(linuxLogPath)) {
  const tailLinux = new Tail(linuxLogPath, "\n", { interval: 499 });
  tailLinux.on("line", lineHandler);
}

const router = express.Router();

app.use(compression());
app.use(express.json());

applyMiddlewares(app);
applyRouters(router);
router.get("/clienttxt", (req, res, next) => {
  console.log("hi");
  try {
    const { start } = req.query;
    let sab = [];
    let steamb = [];
    let linuxb = [];
    if (fs.existsSync(standAloneLogPath)) {
      console.log("sa hi");
      const sa = fs.readFileSync(standAloneLogPath, { encoding: "utf-8" });
      sab = sa.split("\n").slice(-10000);
      console.log("sab.length", sab.length);
    }
    if (fs.existsSync(steamLogPath)) {
      console.log("steam hi");
      const steam = fs.readFileSync(steamLogPath, { encoding: "utf-8" });
      steamb = steam.split("\n").slice(-10000);
    }
    if (fs.existsSync(linuxLogPath)) {
      console.log("steam hi");
      const linux = fs.readFileSync(linuxLogPath, { encoding: "utf-8" });
      linuxb = linux.split("\n").slice(-10000);
    }
    []
      .concat(sab)
      .concat(steamb)
      .concat(linuxb)
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
