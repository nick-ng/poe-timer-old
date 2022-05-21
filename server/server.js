require("dotenv").config();
const express = require("express");
const http = require("http");
const compression = require("compression");
const path = require("path");
const socketio = require("socket.io");
const Tail = require("always-tail2");
const fs = require("fs");
const os = require("os");

const { applyMiddlewares } = require("./middleware");
const { applyRouters } = require("./router");
const poeLogParser = require("./services/poe-log-parser");
const { processLine } = require("./services/poe-log-parser");

const wait = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });

const app = express();
const server = http.createServer(app);
const io = socketio();

io.on("connection", (socket) => {
  console.log("a user connected");
});

const lineEmitter = (lineObject, i = 0) => {
  setTimeout(() => {
    io.emit("clientObject", lineObject);
  }, 50 * i);
};

const lineHandler = (line) => {
  const lineObject = poeLogParser.processLine(line, true);
  if (lineObject.type && lineObject.type !== "donotsend") {
    lineEmitter(lineObject, 0);
  }
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
  try {
    const { start } = req.query;
    let sab = [];
    let steamb = [];
    let linuxb = [];
    if (fs.existsSync(standAloneLogPath)) {
      console.log("Loading Stand Alone Client.txt");
      const sa = fs.readFileSync(standAloneLogPath, { encoding: "utf-8" });
      sab = sa.split("\n").slice(-10000);
      console.log("sab.length", sab.length);
    }
    if (fs.existsSync(steamLogPath)) {
      console.log("Loading Steam Client.txt");
      const steam = fs.readFileSync(steamLogPath, { encoding: "utf-8" });
      steamb = steam.split("\n").slice(-10000);
    }
    if (fs.existsSync(linuxLogPath)) {
      console.log("Loading Steam Client.txt (Linux)");
      const linux = fs.readFileSync(linuxLogPath, { encoding: "utf-8" });
      linuxb = linux.split("\n").slice(-10000);
    }
    []
      .concat(sab)
      .concat(steamb)
      .concat(linuxb)
      .map((line) => processLine(line, true))
      .filter((lineObject) => {
        if (!lineObject.type) {
          return false;
        }
        if (lineObject.type === "donotsend") {
          return false;
        }
        return (
          lineObject.type &&
          (!start || parseInt(start, 10) <= lineObject.timestamp)
        );
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10000)
      .forEach(lineEmitter);
    res.sendStatus(200);
  } catch (e) {
    console.log("error when reading files.", e);
    res.sendStatus(500);
  }
});

router.get("/api/env", (req, res, next) => {
  res.json({
    league: process.env.LEAGUE,
  });
});

router.post("/api/credentials", (req, res, next) => {
  credentials = req.body;
  res.sendStatus(202);
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
const port =
  process.env.NODE_ENV === "production" ? process.env.PORT || 33224 : 33225;
server.listen(port, () => {
  console.log(`${new Date()} Website server listening on ${port}.`);
  console.log(
    "os.networkInterfaces()",
    Object.values(os.networkInterfaces()).map((a) => a.map((b) => b.address))
  );
});

io.listen(process.env.WS_PORT || 33223);
