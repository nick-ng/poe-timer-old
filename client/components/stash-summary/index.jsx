import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Information = styled.div`
  display: flex;
  flex-direction: row;
`;

const Card = styled.div`
  padding: 0 0.5em;

  table {
    border-collapse: collapse;
    border: 1px solid grey;

    td,
    th {
      padding: 0.5em;
      border: 1px solid grey;
    }
  }
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
  };

  switch (slot) {
    case "body":
      return {
        ...baseStyle,
        backgroundColor: "#ffffff",
        color: "#000000",
      };
    case "boot":
      return { ...baseStyle, backgroundColor: "#0000cc" };
    case "helm":
      return { ...baseStyle, backgroundColor: "#009900" };
    case "glove":
      return { ...baseStyle, backgroundColor: "#cc0000" };
    case "weapon":
      return { ...baseStyle };
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

export default function StashSummary() {
  const [inventory, setInventory] = useState({
    chaos: { weapon: 0 },
    regal: { weapon: 0 },
  });
  const [netWorthByStashTab, setNetWorthByStashTab] = useState({});

  const updateInventory = async () => {
    const res = await fetch("/api/chaosrecipe");
    const resJson = await res.json();

    setInventory(resJson);
  };

  const updateNetWorth = async () => {
    const res = await fetch("/api/networthbystashtab");
    const resJson = await res.json();

    setNetWorthByStashTab(resJson);
  };

  useEffect(() => {
    updateInventory();
    updateNetWorth();
    const intervalId = setInterval(() => {
      updateInventory();
      updateNetWorth();
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

  const { totalChaosNetWorth, totalExNetWorth } = Object.values(
    netWorthByStashTab
  ).reduce(
    (prev, curr) => {
      prev.totalChaosNetWorth = prev.totalChaosNetWorth + curr.chaosValue;
      prev.totalExNetWorth = prev.totalExNetWorth + curr.exValue;
      return prev;
    },
    { totalChaosNetWorth: 0, totalExNetWorth: 0 }
  );

  return (
    <Container>
      <h1>Stash Summary</h1>
      <Information>
        <Card>
          <h2>Networth</h2>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Stash Tab</th>
                <th style={{ textAlign: "right" }}>Chaos</th>
                <th style={{ textAlign: "right" }}>Ex</th>
                <th style={{ textAlign: "right" }}>Most Expensive</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "left" }}>Total</td>
                <td style={{ textAlign: "right" }}>
                  {totalChaosNetWorth.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {totalExNetWorth.toFixed(3)}
                </td>
                <td></td>
              </tr>
              {Object.values(netWorthByStashTab).map(
                ({ tabName, chaosValue, exValue, mostExpensiveStack }) => (
                  <tr key={tabName}>
                    <td style={{ textAlign: "left" }}>{tabName}</td>
                    <td style={{ textAlign: "right" }}>
                      {chaosValue.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>{exValue.toFixed(3)}</td>
                    <td style={{ textAlign: "right" }}>
                      {mostExpensiveStack.stackSize}{" "}
                      {mostExpensiveStack.typeLine}: {mostExpensiveStack.value}c
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </Card>
        <Card
          style={{
            textAlign: "right",
          }}
        >
          <h2
            style={{
              color: chaosItems < lowestSlot ? "red" : "white",
            }}
          >
            Chaos Recipe:{" "}
            {Math.min(chaosItems, ...regalAndChaos.map((a) => a.count))}
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
        </Card>
      </Information>
    </Container>
  );
}
