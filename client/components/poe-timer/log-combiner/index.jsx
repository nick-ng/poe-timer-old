import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { secondsToBiggerTime, parseLogString } from "../utils";

const Conntainer = styled.div``;

const TwoColumn = styled.div`
  display: grid;
  justify-content: start;
  grid-template-columns: 1fr 1fr;
`;

export const LogTextArea = styled.textarea`
  width: 350px;
  height: 60px;
`;

export default function LogCombiner() {
  const [logAString, setLogAString] = useState("");
  const [logBString, setLogBString] = useState("");
  const [logABString, setLogABString] = useState("");
  const [logABCSV, setLogABCSV] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const logA = parseLogString(logAString);
    const logB = parseLogString(logBString);

    if (logA.length === 0) {
      return;
    }

    const logAB = [...logA];

    try {
      if (logA[logA.length - 1].zone === logB[0]?.zone) {
        logB.shift();
      }

      logB.forEach((nextEntry) => {
        const lastEntry = logAB[logAB.length - 1];

        logAB.push({
          zone: nextEntry.zone,
          level: nextEntry.level === 1 ? lastEntry.level : nextEntry.level,
          split: nextEntry.split,
          total: lastEntry.total + nextEntry.split,
        });
      });

      const combinedLogString = `### ${secondsToBiggerTime(
        logAB[logAB.length - 1].total
      )}
Zone|Split|Time
--|--|--
${logAB
  .map(
    ({ zone, level, split, total }) =>
      `${zone} (${level})|${secondsToBiggerTime(split)}|${secondsToBiggerTime(
        total
      )}`
  )
  .join("\n")}`;
      setLogABString(combinedLogString);

      const combinedLogCSV = `\t\t${secondsToBiggerTime(
        logAB[logAB.length - 1].total
      )}\t${logAB[logAB.length - 1].total}\nZone\tLevel\tSplit\tTime
${logAB
  .map(
    ({ zone, level, split, total }) => `${zone}\t${level}\t${split}\t${total}`
  )
  .join("\n")}`;
      setLogABCSV(combinedLogCSV);
    } catch (e) {
      setErrorMessage(`Error: ${e}`);
    }
  }, [logAString, logBString]);

  return (
    <Conntainer>
      <h1>Log Combiner</h1>
      <TwoColumn>
        <div>
          <div>Log A</div>
          <LogTextArea
            value={logAString}
            onChange={(e) => {
              setLogAString(e.target.value);
            }}
          />
          <div>Log B</div>
          <LogTextArea
            value={logBString}
            onChange={(e) => {
              setLogBString(e.target.value);
            }}
          />
          <p>{errorMessage}</p>
        </div>
        <div>
          <div>Log A + B</div>
          <LogTextArea value={logABString} onChange={() => {}} />
          <div>Log A + B CSV</div>
          <LogTextArea value={logABCSV} onChange={() => {}} />
        </div>
      </TwoColumn>
    </Conntainer>
  );
}
