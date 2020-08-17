import React, { Fragment, useEffect, useState } from "react";
import moment from "moment";
import styled from "styled-components";
import io from "socket.io-client";

const MILESTONE_SPLITS = "POE_MILESTONE_SPLITS";
const START_TIMESTAMP = "POE_START_TIMESTAMP";

const PageColumns = styled.div`
  margin-top: 1em;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
`;

const ThreeColumn = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1em 0;
`;

const getEvent = (line) => {
  if (line.includes("] : You have entered ")) {
    return {
      type: "enter",
      data: line.replace(/.*] : You have entered /, "").replace(".", ""),
    };
  }

  console.log("un-interesting log", line);
  return {
    type: null,
    data: null,
  };
};

const processLine = (line) => {
  let timestamp = 0;
  try {
    const dateString = line.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/)[0];
    const date = moment(dateString);
    timestamp = date.valueOf();
  } catch (e) {
    console.log("error when getting timestamp.", e);
  }

  const { type, data } = getEvent(line.replace("\n", "").replace("\r", ""));

  return {
    timestamp,
    type,
    data,
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
  const [msSplits, setMsSplits] = useState(
    JSON.parse(localStorage.getItem(MILESTONE_SPLITS) || "[]")
  );
  const [startTimestamp, setStartTimestamp] = useState(
    parseInt(localStorage.getItem(START_TIMESTAMP) || 0)
  );
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  useEffect(() => {
    const socket = io("http://localhost:3001");

    socket.on("connect", () => {
      console.log("connected");
    });

    socket.on("clientLine", (data) => {
      const event = processLine(data);
      setAllEvents((es) => [...es, event].filter((a) => a.type).slice(-100));
      setNewestEvent(event);
    });

    const intervalId = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 500);

    return () => {
      socket.off("clientLine");
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const fullEvent = `${newestEvent.type}-${newestEvent.data}`;
    const fullSplits = splits.map((a) => `${a.type}-${a.data}`);
    if (msSplits.includes(fullEvent) && !fullSplits.includes(fullEvent)) {
      let delta = 0;
      let total = 0;
      if (splits.length > 0) {
        delta = newestEvent.timestamp - splits[splits.length - 1].timestamp;
        total = newestEvent.timestamp - splits[0].timestamp;
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
  }, [newestEvent]);

  useEffect(() => {
    localStorage.setItem(MILESTONE_SPLITS, JSON.stringify(msSplits));
  }, [msSplits]);

  return (
    <div>
      <h1>Timer</h1>
      <button
        onClick={() => {
          setSplits([]);
          setAllEvents([]);
        }}
      >
        Reset
      </button>
      <PageColumns>
        <div>
          <ThreeColumn>
            <div>Zone</div>
            <div>Split</div>
            <div>Time</div>
          </ThreeColumn>
          {splits.map((split) => (
            <ThreeColumn key={split.timestamp}>
              <div>{split.data}</div>
              <div>{`+${secondsToBiggerTime(split.delta / 1000)}`}</div>
              <div>{secondsToBiggerTime(split.total / 1000)}</div>
            </ThreeColumn>
          ))}
          {splits.length > 0 && (
            <ThreeColumn>
              <div>Now</div>
              <div>{`+${secondsToBiggerTime(
                (nowTimestamp - splits[splits.length - 1].timestamp) / 1000
              )}`}</div>
              <div>
                {secondsToBiggerTime(
                  (nowTimestamp - splits[0].timestamp) / 1000
                )}
              </div>
            </ThreeColumn>
          )}
        </div>
        <div>
          {allEvents.map((event) => {
            const fullEvent = `${event.type}-${event.data}`;
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
                key={event.timestamp}
              >
                <div
                  style={{
                    marginRight: "1em",
                  }}
                >
                  {`${moment(event.timestamp).format("hh:mm a")}: ${
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
