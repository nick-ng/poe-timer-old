import React, { useState, useEffect } from "react";
import styled from "styled-components";

import {
  updateCredentials,
  PLAYER_NAME,
  LEAGUE,
  ACCOUNT,
  POESESSID,
} from "../../utils";

const Container = styled.div`
  table {
    font-size: 16pt;
    input {
      font-size: 16pt;
      margin-left: 0.5em;
    }
  }

  button {
    padding: 0.5em 1em;
    margin: 0.5em 0;
  }
`;

export default function Home() {
  const [character, setCharacter] = useState(
    localStorage.getItem(PLAYER_NAME) || ""
  );
  const [league, setLeague] = useState(localStorage.getItem(LEAGUE) || "");
  const [account, setAccount] = useState(localStorage.getItem(ACCOUNT) || "");
  const [poesessid, setPoesessid] = useState(
    localStorage.getItem(POESESSID) || ""
  );

  useEffect(() => {
    (async () => {
      if (league && account && poesessid) {
        await fetch("/api/credentials");
      }
      const res = await fetch("/api/env");
      const { league: fetchedLeague } = await res.json();

      setLeague(fetchedLeague);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(PLAYER_NAME, character);
  }, [character]);

  return (
    <Container>
      <h1>Path of Exile Tools</h1>
      <p>Enter you details below and click save.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          localStorage.setItem(LEAGUE, league);
          localStorage.setItem(ACCOUNT, account);
          localStorage.setItem(POESESSID, poesessid);
          updateCredentials();
        }}
      >
        <table>
          <tbody>
            <tr>
              <td>Character</td>
              <td>
                <input
                  value={character}
                  onChange={(event) => {
                    setCharacter(event.target.value);
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>League</td>
              <td>
                <input
                  value={league}
                  onChange={(event) => {
                    setLeague(event.target.value);
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>Account</td>
              <td>
                <input
                  value={account}
                  onChange={(event) => {
                    setAccount(event.target.value);
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>POESESSID</td>
              <td>
                <input
                  type="password"
                  value={poesessid}
                  onChange={(event) => {
                    setPoesessid(event.target.value);
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <button>Save</button>
      </form>
    </Container>
  );
}
