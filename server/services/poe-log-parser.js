const moment = require("moment");

const {
  ignoreAMid,
  ignoreAEnd,
  ignoreStart,
  ignoreMid,
  ignoreEnd,
} = require("./ignored-log-lines");

const DATE_FORMAT = "YYYY/MM/DD HH:mm:ss";

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
    // Don't send for now
    if (
      ignoreAMid.some((subStr) => line.includes(subStr)) ||
      ignoreAEnd.some((subStr) => line.includes(subStr))
    ) {
      return {
        type: "donotsend",
        data: null,
        details: line,
      };
    }
    // Definitely don't send
    if (
      ignoreStart.some((subStr) => line.includes(subStr)) ||
      ignoreMid.some((subStr) => line.includes(subStr)) ||
      ignoreEnd.some((subStr) => line.includes(subStr))
    ) {
      return {
        type: "donotsend",
        data: null,
        details: null,
      };
    }
  } catch (e) {
    console.log("error when parsing event", e);
  }

  //   console.log("un-interesting log", line);
  return {
    type: null,
    data: null,
    details: line,
  };
};

const processLine = (line, logUnhandledLines = false) => {
  if (!line) {
    return {
      timestamp: 0,
      type: null,
      data: null,
    };
  }

  let timestamp = 0;
  try {
    const dateMatches = line.match(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}/);
    if (dateMatches) {
      const dateString = dateMatches[0];
      const date = moment(dateString, DATE_FORMAT);
      timestamp = date.valueOf();
    }
  } catch (e) {
    console.log("error when getting timestamp.", e);
    console.log(line);
  }

  const { type, data, details } = getEvent(
    line.replace("\n", "").replace("\r", "")
  );

  if (logUnhandledLines && type === null) {
    console.log("unhandled line", details);
  }

  return {
    timestamp,
    type,
    data,
    details,
  };
};

module.exports = {
  getEvent,
  processLine,
};
