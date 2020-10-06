import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const getStyle = (slot, size) => {
  const baseStyle = {
    textTransform: "capitalize",
    padding: "0.2em",
    textAlign: "right",
    border: "1px solid grey",
    marginBottom: "-1px",
    fontSize: `${size}em`,
    opacity: `${size ** 2}`,
    backgroundColor: "#000000",
    order: 2,
  };

  switch (slot) {
    case "body":
      return {
        ...baseStyle,
        backgroundColor: "#ffffff",
        color: "#000000",
        order: 1,
      };
    case "boot":
      return { ...baseStyle, backgroundColor: "#0000cc", order: 1 };
    case "helm":
      return { ...baseStyle, backgroundColor: "#009900", order: 1 };
    case "glove":
      return { ...baseStyle, backgroundColor: "#cc0000", order: 1 };
    case "weapon":
      return { ...baseStyle, order: 1 };
    case "amulet":
      return { ...baseStyle, backgroundColor: "#ffff00", color: "#000000" };
    case "ring":
      return { ...baseStyle, backgroundColor: "#ff00ff", color: "#000000" };
    case "belt":
      return { ...baseStyle, backgroundColor: "#00ffff", color: "#000000" };
    default:
      return baseStyle;
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
  let chaosItems = 0;
  const { chaos, regal } = inventory;
  Object.keys(chaos).forEach((slot) => {
    const count = chaos[slot] + regal[slot];
    regalAndChaos.push({ slot, count, chaosCount: chaos[slot] });
    chaosItems = chaosItems + chaos[slot];
  });

  const almostCompleteSets =
    regalAndChaos.length > 1
      ? regalAndChaos.sort((a, b) => a.count - b.count)[1].count
      : 0;

  const lowestSlot = Math.min(...regalAndChaos.map((a) => a.count));

  return (
    <Container>
      <h1>Chaos Recipe</h1>
      <h2
        style={{
          color: chaosItems < lowestSlot ? "red" : "white",
        }}
      >
        Can make: {Math.min(chaosItems, ...regalAndChaos.map((a) => a.count))}
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {regalAndChaos
          .sort((a, b) => a.count - b.count)
          .map(({ slot, count, chaosCount }) => (
            <div
              style={getStyle(slot, Math.max((20 - count) / 7, 0.1))}
              key={slot}
            >{`${slot}: ${count} (${chaosCount})`}</div>
          ))}
      </div>
    </Container>
  );
}
