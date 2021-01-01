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
const {
  fetchStashTabs,
  chaosRecipe,
  netWorthCalculator,
} = require("./services/poe-stash-tab-fetcher");

const wait = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });

const app = express();
const server = http.createServer(app);
const io = socketio();

let stashTabs = { tabs: [], lastUpdated: 0 };

let credentials = null;

let netWorthByStashTab = {};

let inventory = {
  chaos: { weapon: 0 },
  regal: { weapon: 0 },
  lastUpdated: 0,
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

router.get("/api/networthbystashtab", (req, res, next) => {
  res.json(netWorthByStashTab);
});

router.post("/api/updatestash", async (req, res, next) => {
  await Promise.all([netWorthRunner(), chaosRecipeRunner()]);
  res.sendStatus(201);
});

router.get("/api/env", (req, res, next) => {
  res.json({
    league: process.env.LEAGUE,
  });
});

router.post("/api/credentials", (req, res, next) => {
  credentials = req.body;
  if (req.body.forceUpdate) {
    stashTabFetchRunner();
  }
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

const stashTabCheckPeriod = 2 * 60 * 1000;
async function stashTabFetchRunner() {
  if (!credentials) {
    process.env.NODE_ENV !== "production" &&
      console.log("Waiting for credentials");
    return;
  }

  try {
    const tabs = await fetchStashTabs(credentials);
    stashTabs = {
      tabs,
      lastUpdated: Date.now(),
    };

    inventory = {
      ...(await chaosRecipe(tabs, credentials)),
      lastUpdated: Date.now(),
    };

    netWorthByStashTab = await netWorthCalculator(tabs, credentials);
  } catch (e) {
    console.log(
      "Something went wrong. Check your league, account and poesessid.",
      e
    );
  }
}

const makeStashTabFetchRunner = () => {
  setTimeout(
    async () => {
      await stashTabFetchRunner();
      makeStashTabFetchRunner();
    },
    credentials && stashTabs.lastUpdated > 0 && inventory.lastUpdated > 0
      ? stashTabCheckPeriod
      : 3000
  );
};
stashTabFetchRunner();
makeStashTabFetchRunner();

// starting listening
const port =
  process.env.NODE_ENV === "production" ? process.env.PORT || 33224 : 33225;
server.listen(port, () =>
  console.log(`${new Date()} Website server listening on ${port}.`)
);

io.listen(process.env.WS_PORT || 33223);
