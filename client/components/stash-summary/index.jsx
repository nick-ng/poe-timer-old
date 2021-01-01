import React, { useEffect, useState } from "react";
import styled from "styled-components";

const SNAPSHOT_KEY = "POE_SNAPSHOT_KEY";
const UPDATE_INTERVAL = 10;

const wait = (ms) =>
  new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });

const inventorySummary = (inventory, netWorthByStashTab) => {
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
  let totalChaosNetWorth = 0;
  let totalExNetWorth = 0;
  netWorthByStashTab?.tabs?.forEach((curr) => {
    if (curr.exValue > 0) {
      chaosPerEx = curr.chaosValue / curr.exValue;
    }
    totalChaosNetWorth = totalChaosNetWorth + curr.chaosValue;
    totalExNetWorth = totalExNetWorth + curr.exValue;
  });

  const recipeInChaos = (2 * regalAndChaosCount) / 8;
  const recipeInEx = recipeInChaos / chaosPerEx;
  const totalChaosNetWorthB = totalChaosNetWorth + recipeInChaos;
  const totalExNetWorthB = totalExNetWorth + recipeInEx;

  return {
    chaosPerEx,
    chaosItems,
    lowestSlot,
    recipeInChaos,
    regalAndChaos,
    totalChaosNetWorth,
    totalChaosNetWorthB,
    recipeInEx,
    totalExNetWorth,
    totalExNetWorthB,
  };
};

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
  padding: 0 0.5rem;

  table {
    border-collapse: collapse;
    border: 1px solid grey;

    td,
    th {
      padding: 0.5rem;
      border: 1px solid grey;
    }
  }

  button {
    padding: 0.5rem;
    margin: 0.5rem 0;
  }
`;

const LoadingBar = styled.div`
  height: 0.3rem;
  position: relative;
  border: 1px solid grey;
  margin: 0 0 0.5rem;

  &::after {
    position: absolute;
    content: " ";
    background-color: grey;
    height: 100%;
    width: ${(props) => (props.grow ? "0%" : "100%")};
    transition: width;
    transition-duration: ${(props) => (props.grow ? "120s" : "0s")};
    transition-timing-function: linear;
    left: 0;
    bottom: 0;
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
    padding: "0.2rem",
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
  const [refreshState, setRefreshState] = useState("wait");

  const updateInventory = async () => {
    const res = await fetch("/api/chaosrecipe");
    const resJson = await res.json();
    setInventory(resJson);

    return resJson;
  };

  const updateNetWorth = async () => {
    const res = await fetch("/api/networthbystashtab");
    const resJson = await res.json();
    setNetWorthByStashTab(resJson);

    return resJson;
  };

  useEffect(() => {
    (async () => {
      setRefreshState("loading");
      await wait(100);
      setRefreshState("wait");
    })();
  }, [netWorthByStashTab.timestamp]);

  useEffect(() => {
    updateInventory();
    updateNetWorth();
    const intervalId = setInterval(() => {
      updateInventory();
      updateNetWorth();
    }, UPDATE_INTERVAL * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(netWorthSnapshot));
  }, [netWorthSnapshot]);

  const {
    chaosPerEx,
    lowestSlot,
    chaosItems,
    recipeInChaos,
    regalAndChaos,
    totalChaosNetWorthB,
    recipeInEx,
    totalExNetWorthB,
  } = inventorySummary(inventory, netWorthByStashTab);

  const chaosSinceSnapshot =
    totalChaosNetWorthB - netWorthSnapshot.totalChaosNetWorthB;
  const recipeSinceSnapshot = recipeInChaos - netWorthSnapshot.recipeInChaos;
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
                <th>{hoursSniceSnapshot.toFixed(3)} hours</th>
                <Thr>With Recipe</Thr>
                <Thr>No Recipe</Thr>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Tdl>Difference</Tdl>
                <Tdr>
                  {chaosSinceSnapshot.toFixed(2)} c (
                  {(chaosSinceSnapshot / chaosPerEx).toFixed(3)} ex)
                </Tdr>
                <Tdr>
                  {(chaosSinceSnapshot - recipeSinceSnapshot).toFixed(2)} c
                </Tdr>
              </tr>
              <tr>
                <Tdl>Per Hour</Tdl>
                <Tdr>
                  {(chaosSinceSnapshot / hoursSniceSnapshot).toFixed(2)} c (
                  {(
                    chaosSinceSnapshot /
                    chaosPerEx /
                    hoursSniceSnapshot
                  ).toFixed(3)}{" "}
                  ex)
                </Tdr>
                <Tdr>
                  {(
                    (chaosSinceSnapshot - recipeSinceSnapshot) /
                    hoursSniceSnapshot
                  ).toFixed(2)}{" "}
                  c
                </Tdr>
              </tr>
            </tbody>
          </table>
          <button
            onClick={async () => {
              await fetch("/api/updatestash", {
                method: "POST",
              });
              await updateInventory();
              await updateNetWorth();
            }}
          >
            Update Networth
          </button>
          <button
            onClick={async () => {
              const newInventory = await updateInventory();
              const newNetWorth = await updateNetWorth();
              const {
                totalChaosNetWorthB: totalChaosNetWorthC,
                recipeInChaos: recipeInChaosB,
              } = inventorySummary(newInventory, newNetWorth);
              setNetWorthSnapshot({
                totalChaosNetWorthB: totalChaosNetWorthC,
                recipeInChaos: recipeInChaosB,
                timestamp: Date.now(),
              });
            }}
          >
            Snapshot Networth
          </button>
          <LoadingBar grow={refreshState === "wait"} />
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
              {netWorthByStashTab?.tabs?.map(
                ({ tabName, chaosValue, exValue, mostExpensiveStack }) => (
                  <tr key={tabName}>
                    <td style={{ textAlign: "left" }}>{tabName}</td>
                    <td style={{ textAlign: "right" }}>
                      {chaosValue.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>{exValue.toFixed(3)}</td>
                    <td style={{ textAlign: "left" }}>
                      {mostExpensiveStack.stackSize}{" "}
                      {mostExpensiveStack.typeLine} ={" "}
                      {mostExpensiveStack.value.toFixed(2)} c (
                      {(mostExpensiveStack.value / chaosPerEx).toFixed(3)} ex)
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
