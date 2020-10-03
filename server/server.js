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
const poeLogParser = require("./services/poe-log-parser");
const { processLine } = require("./services/poe-log-parser");
const { chaosRecipe } = require("./services/poe-stash-tab-fetcher");

const app = express();
const server = http.createServer(app);
const io = socketio();

let inventory = {
  chaos: { weapon: 0 },
  regal: { weapon: 0 },
};

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

router.get("/api/chaosrecipe", (req, res, next) => {
  res.json(inventory);
});

app.use(router);

// serve static files
app.use(express.static("assets"));
app.use(express.static("dist"));

// redirect all requests to index.html
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

const chaosRecipeRunner = async () => {
  inventory = await chaosRecipe();
};

const chaosRecipeTimeout = 2 * 60 * 1000;
const makeChaosRecipeTimeout = () => {
  setTimeout(() => {
    chaosRecipeRunner();
    makeChaosRecipeTimeout();
  }, chaosRecipeTimeout);
};
chaosRecipeRunner();
makeChaosRecipeTimeout();

// starting listening
const port = process.env.PORT || 3000;
server.listen(port, () =>
  console.log(`${new Date()} Website server listening on ${port}.`)
);

io.listen(3001);
