import React, { Fragment, useEffect, useState } from "react";
import moment from "moment";
import styled from "styled-components";
import io from "socket.io-client";

const MILESTONE_SPLITS = "POE_MILESTONE_SPLITS";
const PLAYER_NAME = "POE_PLAYER_NAME";
const START_TIMESTAMP = "POE_START_TIMESTAMP";

const DATE_FORMAT = "YYYY/MM/DD hh:mm a";
const LEVEL_MILESTONES = [
  5,
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
  grid-template-columns: auto auto auto;
  gap: 2em;
`;

const ThreeColumn = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 2em 0.2em;
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

const getEvent = (line) => {
  try {
    if (line.includes("] : You have entered ")) {
      const zone = line
        .replace(/^.*] : You have entered /, "")
        .replace(".", "");
      return {
        type: "enter",
        data: zone,
        details: zone,
      };
    }
    if (line.includes(") is now level ")) {
      const level = parseInt(line.replace(/^.*\) is now level /, ""), 0);
      const player = line.replaceAll(/^.*] : | \(.*$/g, "");
      return {
        type: "level",
        details: {
          level,
          player,
        },
        data: `${player}: ${level}`,
      };
    }
  } catch (e) {
    console.log("error when parsing event", e);
  }

  // console.log("un-interesting log", line);
  return {
    type: null,
    data: null,
  };
};

const processLine = (line) => {
  if (!line) {
    return {
      timestamp: 0,
      type: null,
      data: null,
    };
  }

  let timestamp = 0;
  try {
    const dateString = line.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/)[0];
    const date = moment(dateString, "YYYY/MM/DD HH:mm:ss");
    timestamp = date.valueOf();
  } catch (e) {
    console.log("error when getting timestamp.", e);
    console.log(line);
  }

  const { type, data, details } = getEvent(
    line.replace("\n", "").replace("\r", "")
  );

  return {
    timestamp,
    type,
    data,
    details,
  };
};

const secondsToBiggerTime = (seconds) => {
  const seconds0 = Math.round(seconds);
  const hours = Math.floor(seconds0 / 3600);
  const secondsA = seconds0 % 3600;
  const minutes = Math.floor(secondsA / 60);
  const secondsB = secondsA % 60;

  return [
    `${hours}`,
    `${minutes}`.padStart(2, "0"),
    `${secondsB}`.padStart(2, "0"),
  ].join(":");
};

const PoeTimer = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [newestEvent, setNewestEvent] = useState({
    timestamp: 0,
    type: null,
    data: null,
  });
  const [splits, setSplits] = useState([]);
  const [splitsLevel, setSplitsLevel] = useState([]);
  const [msSplits, setMsSplits] = useState(
    JSON.parse(localStorage.getItem(MILESTONE_SPLITS) || "[]")
  );

  const [startTimestamp, setStartTimestamp] = useState(
    parseInt(localStorage.getItem(START_TIMESTAMP) || 0, 10)
  );
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [playerName, setPlayerName] = useState(
    localStorage.getItem(PLAYER_NAME) || ""
  );

  const reloadEvents = (start = 0) => {
    setSplits([]);
    setSplitsLevel([]);
    setAllEvents([]);
    fetch(`/clienttxt?start=${start}`);
  };

  useEffect(() => {
    // register socket
    const socket = io("http://localhost:3001");

    socket.on("connect", () => {
      console.log("connected");
      reloadEvents(startTimestamp);
    });

    socket.on("clientLine", (data) => {
      const event = processLine(data);
      setAllEvents((es) => [...es, event].filter((a) => a.type).slice(-5000));
      setNewestEvent(event);
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
      const fullSplits = splits.map((a) => `${a.type}-${a.data}`);
      if (msSplits.includes(fullEvent) && !fullSplits.includes(fullEvent)) {
        let delta = 0;
        let total = 0;
        if (splits.length > 0) {
          delta = newestEvent.timestamp - splits[splits.length - 1].timestamp;
          total = newestEvent.timestamp - splits[0].timestamp;
        } else {
          setSplitsLevel([
            {
              details: {
                level: "Start",
              },
              delta: 0,
              total: 0,
            },
          ]);
        }
        setSplits([
          ...splits,
          {
            ...newestEvent,
            delta,
            total,
          },
        ]);
      }
    }
    if (newestEvent.type === "level") {
      const { details } = newestEvent;
      const rightPlayer = !playerName || playerName === details.player;

      if (rightPlayer && LEVEL_MILESTONES.includes(details.level)) {
        let delta = 0;
        let total = 0;
        if (splitsLevel.length > 0) {
          delta = newestEvent.timestamp - splits[splits.length - 1].timestamp;
          total = newestEvent.timestamp - splits[0].timestamp;
        }
        setSplitsLevel([
          ...splitsLevel,
          {
            ...newestEvent,
            delta,
            total,
          },
        ]);
      }
    }
  }, [newestEvent]);

  useEffect(() => {
    localStorage.setItem(MILESTONE_SPLITS, JSON.stringify(msSplits));
  }, [msSplits]);
  useEffect(() => {
    localStorage.setItem(START_TIMESTAMP, startTimestamp);
  }, [startTimestamp]);
  useEffect(() => {
    localStorage.setItem(PLAYER_NAME, playerName);
  }, [playerName]);

  const startDate = moment(startTimestamp).format(DATE_FORMAT);

  return (
    <div>
      <h1>Timer</h1>
      <p>{`Starting from ${startDate}`}</p>
      <label>
        Player:{" "}
        <input
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
          }}
        />
      </label>
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
      <PageColumns>
        <div>
          <ThreeColumn>
            <Bold>Zone</Bold>
            <BoldRight>Split</BoldRight>
            <BoldRight>Time</BoldRight>
          </ThreeColumn>
          {splits.map((split) => (
            <ThreeColumn key={split.timestamp}>
              <div>{split.data}</div>
              <Right>{secondsToBiggerTime(split.delta / 1000)}</Right>
              <Right>{secondsToBiggerTime(split.total / 1000)}</Right>
            </ThreeColumn>
          ))}
          {splits.length > 0 && (
            <ThreeColumn>
              <div>Now</div>
              <Right>{`+${secondsToBiggerTime(
                (nowTimestamp - splits[splits.length - 1].timestamp) / 1000
              )}`}</Right>
              <Right>
                {secondsToBiggerTime(
                  (nowTimestamp - splits[0].timestamp) / 1000
                )}
              </Right>
            </ThreeColumn>
          )}
        </div>
        <div>
          <ThreeColumn>
            <Bold>Level</Bold>
            <BoldRight>Split</BoldRight>
            <BoldRight>Time</BoldRight>
          </ThreeColumn>
          {splitsLevel.map((split) => (
            <ThreeColumn key={split.timestamp}>
              <div>{split.details.level}</div>
              <Right>{secondsToBiggerTime(split.delta / 1000)}</Right>
              <Right>{secondsToBiggerTime(split.total / 1000)}</Right>
            </ThreeColumn>
          ))}
          {splits.length > 0 && (
            <ThreeColumn>
              <div>Now</div>
              <Right>{`+${secondsToBiggerTime(
                (nowTimestamp - splits[splits.length - 1].timestamp) / 1000
              )}`}</Right>
              <Right>
                {secondsToBiggerTime(
                  (nowTimestamp - splits[0].timestamp) / 1000
                )}
              </Right>
            </ThreeColumn>
          )}
        </div>
        <div
          style={{
            height: "70vh",
            overflowY: "scroll",
          }}
        >
          <div>{`${allEvents.length} events`}</div>
          {allEvents
            .filter((event) => event.type !== "level")
            .map((event) => {
              const fullEvent = `${event.type}-${event.data}`;
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  key={event.timestamp}
                >
                  <button
                    onClick={() => {
                      setStartTimestamp(event.timestamp);
                    }}
                  >
                    Start from here
                  </button>
                  <div
                    style={{
                      marginRight: "1em",
                    }}
                  >
                    {`${moment(event.timestamp).format(DATE_FORMAT)}: ${
                      event.data
                    }`}
                  </div>
                  <label>
                    Split
                    <input
                      type="checkbox"
                      checked={msSplits.includes(fullEvent)}
                      onChange={() => {
                        if (msSplits.includes(fullEvent)) {
                          setMsSplits(msSplits.filter((e) => e !== fullEvent));
                        } else {
                          setMsSplits([...msSplits, fullEvent]);
                        }
                      }}
                    />
                  </label>
                </div>
              );
            })}
        </div>
      </PageColumns>
    </div>
  );
};

export default PoeTimer;
