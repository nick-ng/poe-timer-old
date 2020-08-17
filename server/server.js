require("dotenv").config();
const express = require("express");
const http = require("http");
const compression = require("compression");
const path = require("path");
const socketio = require("socket.io");
const Tail = require("always-tail2");

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
