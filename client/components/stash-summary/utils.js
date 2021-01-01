export const inventorySummary = (inventory, netWorthByStashTab) => {
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
