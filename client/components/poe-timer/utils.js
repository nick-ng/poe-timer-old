import moment from "moment";

export const DATE_FORMAT = "YYYY/MM/DD HH:mm:ss";

export const getEvent = (line) => {
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
      const player = line.replace(/^.*] : /, "").replace(/ \(.*$/, "");
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

export const processLine = (line) => {
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
    const date = moment(dateString, DATE_FORMAT);
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

export const secondsToBiggerTime = (seconds) => {
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

export const biggerTimeToSeconds = (biggerTime) => {
  const [hourString, minuteString, secondString] = biggerTime.trim().split(":");
  const hours = parseInt(hourString, 10);
  const minutes = parseInt(minuteString, 10);
  const seconds = parseInt(secondString, 10);

  return hours * 3600 + minutes * 60 + seconds;
};

export const parseLogString = (logString) => {
  return logString
    .split("\n")
    .filter((s) => s.match(/\d+:\d{2}:\d{2}\s*\|\s*\d+:\d{2}:\d{2}/))
    .map((s) => s.replace(/^\||\|$/g, ""))
    .map((s) => {
      const [zoneLevel, splitString, totalString] = s.split("|");

      return {
        zone: zoneLevel.replace(/\(\d+\)\s*$/, "").trim(),
        level: parseInt(zoneLevel.match(/(?<=\()\d+(?=\)\s*$)/)[0], 10),
        split: biggerTimeToSeconds(splitString),
        total: biggerTimeToSeconds(totalString),
      };
    });
};
