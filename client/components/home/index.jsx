import React, { useState, useEffect } from "react";
import styled from "styled-components";

const PLAYER_NAME = "POE_PLAYER_NAME";

const Container = styled.div``;

export default function Home() {
  const [character, setCharacter] = useState(
    localStorage.getItem(PLAYER_NAME) || ""
  );
  const [league, setLeague] = useState("(loading)");

  useEffect(() => {
    (async () => {
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
      <p>
        Currently tracking {league} league. If you need to change the league,
        change the league in the .env file and restart the server.
      </p>
      <label>
        Character:{" "}
        <input
          value={character}
          onChange={(event) => {
            setCharacter(event.target.value);
          }}
        />
      </label>
    </Container>
  );
}
