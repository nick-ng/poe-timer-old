import React from "react";
import moment from "moment";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 0.8em;

  &:nth-child(even) {
    background-color: #222222;
  }

  label {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
`;

export default function EventItem({
  event,
  isIgnored,
  startChangeHandler,
  splitIgnoreChangeHandler,
}) {
  return (
    <Container>
      <button onClick={startChangeHandler}>Start from here</button>
      <div
        style={{
          marginRight: "1em",
        }}
      >
        {`${moment(event.timestamp).format("YYYY/MM/DD hh:mm a")}: ${
          event.data
        }`}
      </div>
      <label>
        Split
        <input
          type="checkbox"
          checked={isIgnored}
          onChange={splitIgnoreChangeHandler}
        />
      </label>
    </Container>
  );
}
