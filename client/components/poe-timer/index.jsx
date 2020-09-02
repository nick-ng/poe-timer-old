import React, { useEffect, useState } from "react";
import moment from "moment";
import styled from "styled-components";
import io from "socket.io-client";

import { secondsToBiggerTime } from "./utils";
import EventItem from "./event-item";
import { LogTextArea } from "./log-combiner";
import SplitsTable from "./splits-table";
import WhisperDisplay from "./whisper-display";
import WhisperVoice from "./whisper-voice";

const SPLIT_IGNORE_LIST = "POE_SPLIT_IGNORE_LIST";
const PLAYER_NAME = "POE_PLAYER_NAME";
const START_TIMESTAMP = "POE_START_TIMESTAMP";
const LEVEL_THRESHOLD = "POE_LEVEL_THRESHOLD";

const DISPLAY_DATE_FORMAT = "YYYY/MM/DD hh:mm a";
const ALWAYS_COUNT_ZONES = [
  "Lioneye's Watch",
  "Forest Encampment",
  "Sarn Encampment",
  "Highgate",
  "Overseer's Tower",
  "Bridge Encampment",
  "Oriath Docks",
  " Hideout",
  "Aspirants' Plaza",
  "Aspirant's Trial",
];
const LEVEL_MILESTONES = [
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  85,
  90,
  91,
  92,
  93,
  94,
  95,
  96,
  97,
  98,
  99,
  100,
];

const PageColumns = styled.div`
  margin-top: 1em;
  display: grid;
  grid-template-columns: 3fr 2fr 3fr;
  gap: 0.5em;

  & > * {
    border: 1px solid grey;
    padding: 0.5em;
  }
`;

const ControlBar = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 1em;
`;

const ThreeColumn = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2em 0.2em;

  div {
    padding: 0.1em 0.2em;
  }
`;

const Bold = styled.div`
  font-weight: bold;
`;

const BoldRight = styled.div`
  font-weight: bold;
  text-align: right;
`;

const Right = styled.div`
  font-family: Consolas, monospace;
  text-align: right;
`;

const nextSplit = (splits, event) => {
  if (splits.length > 0) {
    const timestamps = splits.map((split) => split.timestamp);
    return {
      delta: event.timestamp - Math.max(...timestamps),
      total: event.timestamp - Math.min(...timestamps),
    };
  }

  return {
    delta: 0,
    total: 0,
  };
};

export default function PoeTimer() {
  const [allEvents, setAllEvents] = useState([]);
  const [newestEvent, setNewestEvent] = useState({
    timestamp: 0,
    type: null,
    data: null,
  });
  const [splits, setSplits] = useState([]);
  const [splitsOther, setSplitsOther] = useState([]);
  const [splitIgnoreList, setSplitIgnoreList] = useState(
    JSON.parse(localStorage.getItem(SPLIT_IGNORE_LIST) || "[]")
  );
  const [startTimestamp, setStartTimestamp] = useState(
    parseInt(localStorage.getItem(START_TIMESTAMP) || 0, 10)
  );
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [playerName, setPlayerName] = useState(
    localStorage.getItem(PLAYER_NAME) || ""
  );
  const [playerLevel, setPlayerLevel] = useState(1);
  const [levelThreshold, setLevelThreshold] = useState(
    parseInt(localStorage.getItem(LEVEL_THRESHOLD) || 10),
    10
  );
  const [socketConnected, setSocketConnected] = useState(false);
  const [eventFilter, setEventFilter] = useState("");

  const reloadEvents = (start = 0) => {
    setSplits([]);
    setSplitsOther([]);
    setAllEvents([]);
    setPlayerLevel(1);
    fetch(`/clienttxt?start=${start}`);
  };

  useEffect(() => {
    // register socket
    const socket = io("http://localhost:3001");

    socket.on("connect", () => {
      console.log("connected");
      setSocketConnected(true);
    });

    socket.on("clientObject", (data) => {
      setAllEvents((es) => [data, ...es].filter((a) => a.type).slice(-5000));
      setNewestEvent(data);
    });

    // set time updater
    const intervalId = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 500);

    return () => {
      // unregister socket
      socket.off("clientLine");
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (startTimestamp > newestEvent.timestamp) {
      return;
    }
    const fullEvent = `${newestEvent.type}-${newestEvent.data}`;
    if (newestEvent.type === "enter") {
      const reCountZone =
        ALWAYS_COUNT_ZONES.includes(newestEvent.details) ||
        splits.every(
          (split) =>
            split.details !== newestEvent.details ||
            playerLevel - split.playerLevel > levelThreshold
        );
      if (!splitIgnoreList.includes(fullEvent) && reCountZone) {
        const { delta, total } = nextSplit(splits, newestEvent);
        setSplits([
          {
            ...newestEvent,
            playerLevel,
            zone: newestEvent.data.replace("The ", ""),
            data: `${newestEvent.data.replace("The ", "")} (${playerLevel})`,
            delta,
            total,
            fullerEvent: `${fullEvent}-${playerLevel}`,
          },
          ...splits,
        ]);
      }

      if (splits.length === 0) {
        setSplitsOther([
          {
            data: "Start",
            delta: 0,
            total: 0,
            timestamp: newestEvent.timestamp,
          },
        ]);
      }
    }
    if (newestEvent.type === "kitava") {
      const { delta, total } = nextSplit(splits, newestEvent);
      setSplitsOther([
        {
          data: `Act 5 Kitava`,
          delta,
          total,
          timestamp: newestEvent.timestamp,
        },
        ...splitsOther,
      ]);
    }
    if (newestEvent.type === "level") {
      const { details } = newestEvent;
      const rightPlayer = !playerName || playerName === details.player;
      if (rightPlayer) {
        setPlayerLevel(details.level);
      }

      if (rightPlayer && LEVEL_MILESTONES.includes(details.level)) {
        const { delta, total } = nextSplit(splitsOther, newestEvent);

        setSplitsOther([
          {
            data: `Level ${details.level}`,
            delta,
            total,
            timestamp: newestEvent.timestamp,
          },
          ...splitsOther,
        ]);
      }
    }
  }, [newestEvent]);

  useEffect(() => {
    if (socketConnected) {
      reloadEvents(startTimestamp);
    }
  }, [socketConnected]);

  useEffect(() => {
    localStorage.setItem(SPLIT_IGNORE_LIST, JSON.stringify(splitIgnoreList));
  }, [splitIgnoreList]);
  useEffect(() => {
    localStorage.setItem(START_TIMESTAMP, startTimestamp);
  }, [startTimestamp]);
  useEffect(() => {
    localStorage.setItem(PLAYER_NAME, playerName);
  }, [playerName]);
  useEffect(() => {
    localStorage.setItem(LEVEL_THRESHOLD, levelThreshold);
  }, [levelThreshold]);

  const startDate = moment(startTimestamp).format(DISPLAY_DATE_FORMAT);
  const markdownTable = [
    ...splits.map((split) =>
      [
        split.data,
        secondsToBiggerTime(split.delta / 1000),
        secondsToBiggerTime(split.total / 1000),
      ].join("|")
    ),
  ];
  markdownTable.reverse();

  const logCSV = [
    ...splits.map((split) =>
      [
        split.zone,
        split.playerLevel,
        Math.round(split.delta / 1000),
        Math.round(split.total / 1000),
      ].join("\t")
    ),
  ];
  logCSV.reverse();

  return (
    <div>
      <h1>Timer</h1>
      <ControlBar>
        <div>
          <p>{`Starting from ${startDate}`}</p>
          <button onClick={() => reloadEvents(startTimestamp)}>
            {`Reload from ${startDate}`}
          </button>
          <button onClick={() => reloadEvents(0)}>Reload everything</button>
          <button
            onClick={() => {
              setStartTimestamp(Date.now());
            }}
          >
            Change start to now
          </button>
          <button
            onClick={() => {
              setStartTimestamp(0);
            }}
          >
            Change start to zero
          </button>
          <label>
            Player:{" "}
            <input
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
              }}
            />
          </label>
        </div>
        <div>
          <LogTextArea
            value={
              splits.length > 0
                ? `### ${startDate} - ${secondsToBiggerTime(
                    splits[0].total / 1000
                  )}\nZone|Split|Time\n--|--|--\n${markdownTable.join("\n")}`
                : ""
            }
          />
          <LogTextArea
            value={
              splits.length > 0
                ? `${startDate}\t\t${secondsToBiggerTime(
                    splits[0].total / 1000
                  )}\t${
                    splits[0].total / 1000
                  }\nZone\tLevel\tSplit\tTime\n${logCSV.join("\n")}`
                : ""
            }
          />
        </div>
      </ControlBar>
      <PageColumns>
        <div>
          <SplitsTable splits={splits} splitName="Zone" />
        </div>
        <div>
          <SplitsTable splits={splitsOther} splitName="Other" positiveEdge />
        </div>
        <div
          style={{
            height: "70vh",
            overflowY: "scroll",
          }}
        >
          <label>
            Zone-Level Threshold:
            <input
              style={{
                width: "2em",
                marginRight: "1em",
              }}
              type="text"
              value={levelThreshold}
              onChange={(e) => {
                setLevelThreshold(e.target.value);
              }}
            />
          </label>
          <label>
            Filter:
            <input
              type="text"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
              }}
            />
          </label>
          <button
            onClick={() => {
              setEventFilter("");
            }}
          >
            Clear
          </button>
          {allEvents
            .filter(
              (event) =>
                event.type !== "level" &&
                event.data.toUpperCase().includes(eventFilter.toUpperCase())
            )
            .map((event) => {
              const fullEvent = `${event.type}-${event.data}`;
              return (
                <EventItem
                  key={event.timestamp}
                  event={event}
                  isIgnored={!splitIgnoreList.includes(fullEvent)}
                  startChangeHandler={() => {
                    setStartTimestamp(event.timestamp);
                  }}
                  splitIgnoreChangeHandler={() => {
                    if (!splitIgnoreList.includes(fullEvent)) {
                      setSplitIgnoreList(
                        splitIgnoreList.filter((e) => e !== fullEvent)
                      );
                    } else {
                      setSplitIgnoreList([...splitIgnoreList, fullEvent]);
                    }
                  }}
                />
              );
            })}
        </div>
      </PageColumns>
      <WhisperDisplay allEvents={allEvents} />
      <WhisperVoice event={allEvents[0]} />
    </div>
  );
}
