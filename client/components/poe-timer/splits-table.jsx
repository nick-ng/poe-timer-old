import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { msToBiggerTime } from "./utils";

const MainTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  tbody tr:nth-child(odd) {
    background-color: #202020;
  }

  tbody tr:first-child {
    background-color: #222222;
    font-size: 1.3em;
  }

  th,
  td {
    padding: 0.1em 0.2em;
  }
`;

export default function SplitsTable({
  splits,
  splitName,
  positiveEdge = false,
  hideSplit = false,
  nextSplit = "Now",
}) {
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <MainTable>
      <thead>
        <tr>
          <th style={{ textAlign: "left" }}>{splitName}</th>
          {!hideSplit && <th style={{ textAlign: "right" }}>Split</th>}
          <th style={{ textAlign: "right" }}>Time</th>
        </tr>
      </thead>
      <tbody>
        {positiveEdge && splits.length > 0 && (
          <tr>
            <td>{nextSplit}</td>
            {!hideSplit && (
              <td
                style={{
                  textAlign: "right",
                  fontFamily: "Consolas, monospace",
                }}
              >
                {msToBiggerTime(nowTimestamp - splits[0].timestamp)}
              </td>
            )}
            <td
              style={{
                textAlign: "right",
                fontFamily: "Consolas, monospace",
              }}
            >
              {msToBiggerTime(
                nowTimestamp - splits[splits.length - 1].timestamp
              )}
            </td>
          </tr>
        )}
        {splits.map((split, i) => {
          let delta = 0;
          let total = 0;

          if (positiveEdge) {
            if (i === splits.length - 1) {
              return null;
            }

            delta = split.timestamp - splits[i + 1].timestamp;
            total = split.total;
          } else {
            if (i === 0) {
              delta = nowTimestamp - split.timestamp;
              total = nowTimestamp - splits[splits.length - 1].timestamp;
            } else {
              delta = splits[i - 1].timestamp - split.timestamp;
              total =
                splits[i - 1].timestamp - splits[splits.length - 1].timestamp;
            }
          }

          return (
            <tr>
              <td>{split.data}</td>
              {!hideSplit && (
                <td
                  style={{
                    textAlign: "right",
                    fontFamily: "Consolas, monospace",
                  }}
                >
                  {msToBiggerTime(delta)}
                </td>
              )}
              <td
                style={{
                  textAlign: "right",
                  fontFamily: "Consolas, monospace",
                }}
              >
                {msToBiggerTime(total)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </MainTable>
  );
}
