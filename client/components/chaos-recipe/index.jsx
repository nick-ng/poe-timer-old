import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const getColour = (slot) => {
  switch (slot) {
    case "body":
      return { backgroundColor: "#ffffff", color: "#000000" };
    case "boot":
      return { backgroundColor: "#0000cc" };
    case "helm":
      return { backgroundColor: "#009900" };
    case "glove":
      return { backgroundColor: "#cc0000" };
    default:
      return { backgroundColor: "#000000" };
  }
};

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

  const regalAndChaos = [];
  const { chaos, regal } = inventory;
  Object.keys(chaos).forEach((slot) => {
    const count = chaos[slot] + regal[slot];
    regalAndChaos.push({ slot, count, chaosCount: chaos[slot] });
  });

  const almostCompleteSets =
    regalAndChaos.length > 1
      ? regalAndChaos.sort((a, b) => a.count - b.count)[1].count
      : 0;

  return (
    <Container>
      <h1>Chaos Recipe</h1>
      <div>
        {regalAndChaos
          .sort((a, b) => a.count - b.count)
          .map(({ slot, count, chaosCount }) => (
            <div
              style={{
                ...getColour(slot),
                textTransform: "capitalize",
                padding: "0.2em",
                textAlign: "right",
                borderTop: "1px solid grey",
                fontSize: `${0.8 + (almostCompleteSets + 1) / (count + 1)}em`,
              }}
              key={slot}
            >{`${slot}: ${count} (${chaosCount})`}</div>
          ))}
      </div>
    </Container>
  );
}
