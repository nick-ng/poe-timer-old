import React from "react";
import styled from "styled-components";
import moment from "moment";

import { parseTradeMessage } from "../utils";

const Container = styled.tr`
  &:nth-child(even) {
    background-color: Gainsboro;
  }

  td {
    padding: 0.1em 0.5em;

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }
`;

export default function WhisperRow({ event, onDismiss }) {
  const { timestamp, details } = event;
  const { name, message } = details;
  const { item, price, stashTab, left, top } = parseTradeMessage(message);

  return (
    <Container>
      <td>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`/invite ${name}`);
          }}
        >
          Invite
        </button>
      </td>
      <td>{`${moment().diff(moment(timestamp), "minutes")} minutes ago`}</td>
      <td>{name}</td>
      <td>{item}</td>
      <td>{price}</td>
      <td>{stashTab}</td>
      <td>{left && `L: ${left}`}</td>
      <td>{top && `T: ${top}`}</td>
      <td>{message}</td>
      <td>
        <button onClick={onDismiss}>Dismiss</button>
      </td>
    </Container>
  );
}
