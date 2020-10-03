import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export default function ChaosRecipe() {
  const [inventory, setInventory] = useState({
    chaos: { weapon: 0 },
    regal: { weapon: 0 },
  });

  const updateInventory = async () => {
    const res = await fetch("/api/chaosrecipe");
    const resJson = await res.json();

    setInventory(resJson);
  };

  useEffect(() => {
    updateInventory();
    const intervalId = setInterval(() => {
      updateInventory();
    }, 10 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const render = [];
  const { chaos, regal } = inventory;
  const counts = [];
  Object.keys(chaos).forEach((slot) => {
    const count = chaos[slot] + regal[slot];
    counts.push(count);
    render.push({ slot, count });
  });
  counts.sort();

  const almostCompleteSets = counts[1];

  return (
    <Container>
      <h1>Chaos Recipe Helper</h1>
      <div
        style={{
          color: almostCompleteSets > 5 ? "red" : "grey",
          fontSize: almostCompleteSets > 5 ? "2em" : "0.7em",
          margin: "1em 0",
        }}
      >{`Almost complete sets: ${almostCompleteSets}`}</div>
      <div>
        {render
          .sort((a, b) => a.count - b.count)
          .map((item) => (
            <div key={item.slot}>{`${item.slot}: ${item.count}`}</div>
          ))}
      </div>
    </Container>
  );
}
