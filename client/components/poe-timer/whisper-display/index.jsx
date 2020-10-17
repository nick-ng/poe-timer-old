import React, { useEffect, useState } from "react";
import styled from "styled-components";

import WhisperRow from "./whisper-row";

const DISMISSED_KEY = "POE_DISMISSED_WHISPERS";
const MAX_WHISPER_AGE_MINUTES_KEY = "POE_MAX_WHISPER_AGE_MINUTES";
const DEFAULT_MAX_AGE_MINUTES = 120;

const getWhisperHash = ({ timestamp, data }) => `${timestamp}-${data}`;

const Container = styled.div`
  position: fixed;
  left: 0;
  bottom: 0;
  max-height: 200px;
  max-width: 60vw;
  overflow-y: scroll;
  padding: 0.5rem;
  background-color: #eeeeee;
  border-top: 1px solid grey;
  border-right: 1px solid grey;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  button: {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  span {
    margin-left: 1rem;
  }
`;

const WhisperList = styled.table`
  border-collapse: collapse;
`;

export default function WhisperDisplay({ allEvents }) {
  const [dismissedWhispers, setDismissedWhispers] = useState(
    JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")
  );
  const [maxWhisperAgeMinutes, setMaxWhisperAgeMinutes] = useState(
    parseInt(
      localStorage.getItem(MAX_WHISPER_AGE_MINUTES_KEY) ||
        DEFAULT_MAX_AGE_MINUTES,
      10
    )
  );
  const [whisperEvents, setWhisperEvents] = useState([]);
  const [minimised, setMinimised] = useState(false);

  useEffect(() => {
    const timestampThreshold = Date.now() - maxWhisperAgeMinutes * 60 * 1000;
    setWhisperEvents(
      allEvents.filter(
        (event) =>
          event.type === "whisper" &&
          event.timestamp > timestampThreshold &&
          !dismissedWhispers.map(getWhisperHash).includes(getWhisperHash(event))
      )
    );
  }, [allEvents, dismissedWhispers]);

  useEffect(() => {
    const timestampThreshold = Date.now() - maxWhisperAgeMinutes * 60 * 1000;
    const recentDismissedWhispers = dismissedWhispers.filter(
      (event) => event.timestamp > timestampThreshold
    );
    localStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify(recentDismissedWhispers)
    );
  }, [dismissedWhispers]);

  return (
    <Container>
      <Controls>
        <button
          onClick={() => {
            setMinimised(!minimised);
          }}
        >
          {minimised ? "+" : "-"}
        </button>
        <span>{`${whisperEvents.length} whispers`}</span>
      </Controls>
      {!minimised && (
        <WhisperList>
          <tbody>
            {whisperEvents.map((event) => (
              <WhisperRow
                event={event}
                onDismiss={() => {
                  setDismissedWhispers([...dismissedWhispers, event]);
                }}
              />
            ))}
          </tbody>
        </WhisperList>
      )}
    </Container>
  );
}
