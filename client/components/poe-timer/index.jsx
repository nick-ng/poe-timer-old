import React, { useEffect, useState } from "react";
import moment from "moment";
import styled from "styled-components";
import io from "socket.io-client";

import { processLine, secondsToBiggerTime, DATE_FORMAT } from "./utils";

const MILESTONE_SPLITS = "POE_MILESTONE_SPLITS";
const PLAYER_NAME = "POE_PLAYER_NAME";
const START_TIMESTAMP = "POE_START_TIMESTAMP";
const LEVEL_THRESHOLD = "POE_LEVEL_THRESHOLD";

const DISPLAY_DATE_FORMAT = "YYYY/MM/DD hh:mm a";
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
  const [playerLevel, setPlayerLevel] = useState(1);
  const [levelThreshold, setLevelThreshold] = useState(
    parseInt(localStorage.getItem(LEVEL_THRESHOLD) || 10),
    10
  );
  const [socketConnected, setSocketConnected] = useState(false);

  const reloadEvents = (start = 0) => {
    setSplits([]);
    setSplitsLevel([]);
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

    socket.on("clientLine", (data) => {
      const event = processLine(data);
      setAllEvents((es) => [event, ...es].filter((a) => a.type).slice(-5000));
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
      const fullerEvent = `${fullEvent}-${playerLevel}`;
      const reCountZone = splits.every((split) => {
        if (split.details === newestEvent.details) {
          if (playerLevel - split.playerLevel <= levelThreshold) {
            return false;
          }
        }
        return true;
      });
      if (msSplits.includes(fullEvent) && reCountZone) {
        let delta = 0;
        let total = 0;
        if (splits.length > 0) {
          delta = newestEvent.timestamp - splits[splits.length - 1].timestamp;
          total = newestEvent.timestamp - splits[0].timestamp;
        } else {
          setSplitsLevel([
            {
              details: {
                level: playerLevel,
              },
              delta: 0,
              total: 0,
              timestamp: newestEvent.timestamp,
            },
          ]);
        }
        setSplits([
          {
            ...newestEvent,
            playerLevel,
            data: `${newestEvent.data.replace("The ", "")} (${playerLevel})`,
            delta,
            total,
            fullerEvent,
          },
          ...splits,
        ]);
      }
    }
    if (newestEvent.type === "level") {
      const { details } = newestEvent;
      const rightPlayer = !playerName || playerName === details.player;
      if (rightPlayer) {
        setPlayerLevel(details.level);
      }

      if (rightPlayer && LEVEL_MILESTONES.includes(details.level)) {
        let delta = 0;
        let total = 0;
        if (splitsLevel.length > 0) {
          delta =
            newestEvent.timestamp -
            splitsLevel[splitsLevel.length - 1].timestamp;
          total = newestEvent.timestamp - splitsLevel[0].timestamp;
        }

        setSplitsLevel([
          {
            ...newestEvent,
            delta,
            total,
          },
          ...splitsLevel,
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
    localStorage.setItem(MILESTONE_SPLITS, JSON.stringify(msSplits));
  }, [msSplits]);
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
  const markdownTable = splits
    .map((split) =>
      [
        split.data,
        secondsToBiggerTime(split.delta / 1000),
        secondsToBiggerTime(split.total / 1000),
      ].join("|")
    )
    .join("\n");

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
              <Right>
                {secondsToBiggerTime(
                  (nowTimestamp - splits[splits.length - 1].timestamp) / 1000
                )}
              </Right>
              <Right>
                {secondsToBiggerTime(
                  (nowTimestamp - splits[0].timestamp) / 1000
                )}
              </Right>
            </ThreeColumn>
          )}
          {splits.length > 0 && (
            <textarea
              style={{ marginTop: "1em", width: "350px", height: "60px" }}
              value={`### ${startDate} - ${secondsToBiggerTime(
                splits[splits.length - 1].total / 1000
              )}\nZone|Split|Time\n--|--|--\n${markdownTable}`}
            />
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
              <Right>
                {secondsToBiggerTime(
                  (nowTimestamp - splits[splits.length - 1].timestamp) / 1000
                )}
              </Right>
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
          <label>
            Zone-Level Threshold:{" "}
            <input
              value={levelThreshold}
              onChange={(e) => {
                setLevelThreshold(e.target.value);
              }}
            />
          </label>
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
                    {`${moment(event.timestamp).format(
                      "YYYY/MM/DD hh:mm a"
                    )}: ${event.data}`}
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
