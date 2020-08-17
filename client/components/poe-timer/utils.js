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
