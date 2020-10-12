import React, { useEffect, useState } from "react";
import styled from "styled-components";

const SNAPSHOT_KEY = "POE_SNAPSHOT_KEY";

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

  button {
    padding: 0.5em;
    margin: 0.5em 0;
  }
`;

const Thl = styled.th`
  text-align: left;
`;
const Thr = styled.th`
  text-align: right;
`;
const Tdl = styled.td`
  text-align: left;
`;
const Tdr = styled.td`
  text-align: right;
`;

const getStyle = (slot, size) => {
  const baseStyle = {
    textTransform: "capitalize",
    padding: "0.2em",
    textAlign: "right",
    border: "1px solid grey",
    marginBottom: "-1px",
    fontSize: `${Math.max(size, 0.25)}em`,
    opacity: `${Math.max(size, 0.3)}`,
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
  const [netWorthSnapshot, setNetWorthSnapshot] = useState(
    JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "{}")
  );

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

  useEffect(() => {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(netWorthSnapshot));
  }, [netWorthSnapshot]);

  const regalAndChaos = [];
  let chaosItems = 0;
  const { chaos, regal } = inventory;
  Object.keys(chaos).forEach((slot) => {
    const count = chaos[slot] + regal[slot];
    regalAndChaos.push({ slot, count, chaosCount: chaos[slot] });
    chaosItems = chaosItems + chaos[slot];
  });

  const lowestSlot = Math.min(...regalAndChaos.map((a) => a.count));
  const regalAndChaosCount = regalAndChaos.reduce((p, c) => p + c.count, 0);

  let chaosPerEx = 0;
  const { totalChaosNetWorth, totalExNetWorth } = Object.values(
    netWorthByStashTab
  ).reduce(
    (prev, curr) => {
      if (curr.exValue > 0) {
        chaosPerEx = curr.chaosValue / curr.exValue;
      }
      prev.totalChaosNetWorth = prev.totalChaosNetWorth + curr.chaosValue;
      prev.totalExNetWorth = prev.totalExNetWorth + curr.exValue;
      return prev;
    },
    {
      totalChaosNetWorth: 0,
      totalExNetWorth: 0,
    }
  );

  const recipeInChaos = 2 * Math.min(chaosItems, lowestSlot);
  const recipeInEx = recipeInChaos / chaosPerEx;
  const totalChaosNetWorthB = totalChaosNetWorth + recipeInChaos;
  const totalExNetWorthB = totalExNetWorth + recipeInEx;

  const chaosSinceSnapshot =
    totalChaosNetWorthB - netWorthSnapshot.totalChaosNetWorthB;
  const hoursSniceSnapshot =
    (Date.now() - netWorthSnapshot.timestamp) / (1000 * 60 * 60);

  return (
    <Container>
      <h1>Stash Summary</h1>
      <Information>
        <Card>
          <h2>Networth</h2>
          <h3>Chaos/Ex: {chaosPerEx}</h3>
          <table>
            <thead>
              <tr>
                <Thl>Stash Tab</Thl>
                <Thr>Chaos</Thr>
                <Thr>Ex</Thr>
                <Thl>Notes</Thl>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: "left" }}>Total</td>
                <td style={{ textAlign: "right" }}>
                  {totalChaosNetWorthB.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {totalExNetWorthB.toFixed(3)}
                </td>
                <td style={{ textAlign: "left" }}></td>
              </tr>
              <tr>
                <td style={{ textAlign: "left" }}>Chaos Recipe</td>
                <td style={{ textAlign: "right" }}>
                  {recipeInChaos.toFixed(2)}
                </td>
                <td style={{ textAlign: "right" }}>{recipeInEx.toFixed(3)}</td>
                <td style={{ textAlign: "left" }}></td>
              </tr>
              {Object.values(netWorthByStashTab).map(
                ({ tabName, chaosValue, exValue, mostExpensiveStack }) => (
                  <tr key={tabName}>
                    <td style={{ textAlign: "left" }}>{tabName}</td>
                    <td style={{ textAlign: "right" }}>
                      {chaosValue.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>{exValue.toFixed(3)}</td>
                    <td style={{ textAlign: "left" }}>
                      {mostExpensiveStack.stackSize}{" "}
                      {mostExpensiveStack.typeLine} = {mostExpensiveStack.value}{" "}
                      c
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          <button
            onClick={() => {
              setNetWorthSnapshot({
                totalChaosNetWorthB,
                timestamp: Date.now(),
              });
            }}
          >
            Snapshot Networth
          </button>
          {hoursSniceSnapshot > 0 && (
            <table>
              <thead>
                <tr>
                  <th></th>
                  <Thr>Chaos</Thr>
                  <Thr>Ex</Thr>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Tdl>Diff</Tdl>
                  <Tdr>{chaosSinceSnapshot.toFixed(2)}</Tdr>
                  <Tdr>{(chaosSinceSnapshot / chaosPerEx).toFixed(3)}</Tdr>
                </tr>
                <tr>
                  <Tdl>per Hr</Tdl>
                  <Tdr>
                    {(chaosSinceSnapshot / hoursSniceSnapshot).toFixed(2)}
                  </Tdr>
                  <Tdr>
                    {(
                      chaosSinceSnapshot /
                      chaosPerEx /
                      hoursSniceSnapshot
                    ).toFixed(3)}
                  </Tdr>
                </tr>
              </tbody>
            </table>
          )}
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
