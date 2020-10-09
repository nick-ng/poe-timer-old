const fetch = require("node-fetch");

const poeItems = require("./poe-items");

const NORMAL_STASH_TABS = ["NormalStash", "QuadStash", "PremiumStash"];
const EXCLUDED_CURRENCY = [
  "Armourer's Scrap",
  "Blacksmith's Whetstone",
  "Chromatic Orb",
  "Portal Scroll",
  "Silver Coin",
  "Scroll of Wisdom",
  "Glassblower's Bauble",
  "Perandus Coin",
  "Orb of Transmutation",
];

const poeNinjaData = {};

const fetchStashTabs = async () => {
  const res = await fetch(
    `https://www.pathofexile.com/character-window/get-stash-items?accountName=${process.env.ACCOUNT_NAME}&realm=pc&league=${process.env.LEAGUE}&tabs=1`,
    {
      credentials: "include",
      headers: {
        cookie: `POESESSID=${process.env.POESESSID}`,
      },
      method: "GET",
    }
  );

  try {
    const jsonRes = await res.json();
    const { tabs } = jsonRes;

    return tabs;
  } catch (e) {
    console.log("error when fetching tab names", e);
    return [];
  }
};

const fetchStashTabContents = async (tabId) => {
  const res = await fetch(
    `https://www.pathofexile.com/character-window/get-stash-items?accountName=${process.env.ACCOUNT_NAME}&realm=pc&league=${process.env.LEAGUE}&tabIndex=${tabId}`,
    {
      credentials: "include",
      headers: {
        cookie: `POESESSID=${process.env.POESESSID}`,
      },
      method: "GET",
    }
  );

  try {
    const jsonRes = await res.json();
    const { items } = jsonRes;
    return items;
  } catch (e) {
    console.log("error when fetching tab contents", e);
    return [];
  }
};

const getItemType = (item) => {
  const {
    boot,
    glove,
    body,
    helm,
    ring,
    amulet,
    belt,
    twoHandedWeapons,
  } = poeItems;
  const { typeLine } = item;

  if (item.identified) {
    return { slot: "identified", count: 0 };
  }

  if (item.properties) {
    const { properties } = item;
    if (properties.some((property) => property.name === "Physical Damage")) {
      if (
        twoHandedWeapons.some((a) =>
          properties[0].name.toLowerCase().includes(a)
        )
      ) {
        return { slot: "weapon", count: 1 };
      }

      return { slot: "weapon", count: 0.5 };
    }

    if (properties.some((property) => property.name === "Chance to Block")) {
      return { slot: "weapon", count: 0.5 };
    }
  }

  if (ring.some((a) => typeLine.toLowerCase().includes(a))) {
    return { slot: "ring", count: 0.5 };
  }

  if (amulet.some((a) => typeLine.toLowerCase().includes(a))) {
    return { slot: "amulet", count: 1 };
  }

  if (belt.some((a) => typeLine.toLowerCase().includes(a))) {
    return { slot: "belt", count: 1 };
  }

  if (helm.some((a) => typeLine.toLowerCase().includes(a))) {
    return { slot: "helm", count: 1 };
  }

  if (boot.some((a) => typeLine.toLowerCase().includes(a))) {
    return { slot: "boot", count: 1 };
  }

  if (glove.some((a) => typeLine.toLowerCase().includes(a))) {
    return { slot: "glove", count: 1 };
  }

  if (body.some((a) => typeLine.toLowerCase().includes(a))) {
    return { slot: "body", count: 1 };
  }

  console.log("unknown-item", item);
  return { slot: "unknown", count: 0 };
};

const recipeInfo = (item) => {
  if (item.identified) {
    return null;
  }

  const { slot, count } = getItemType(item);

  if (slot === "unknown" || slot === "identified") {
    return null;
  }

  let recipeType = "chance";
  if (item.ilvl >= 75) {
    recipeType = "regal";
  } else if (item.ilvl >= 60) {
    recipeType = "chaos";
  }

  return {
    slot,
    count,
    recipeType,
  };
};

const chaosRecipe = async (tabs = []) => {
  const chaosRecipeTabs = tabs.filter((tab) => tab.n.includes("chaos_"));

  const inventory = {
    regal: {
      weapon: 0,
      boot: 0,
      glove: 0,
      body: 0,
      helm: 0,
      ring: 0,
      amulet: 0,
      belt: 0,
    },
    chaos: {
      weapon: 0,
      boot: 0,
      glove: 0,
      body: 0,
      helm: 0,
      ring: 0,
      amulet: 0,
      belt: 0,
    },
  };

  const res = await Promise.all(
    chaosRecipeTabs.map((tab) => fetchStashTabContents(tab.i))
  );

  res.forEach((contents) => {
    contents.forEach((item, i) => {
      const info = recipeInfo(item);

      if (!info) {
        return;
      }

      if (inventory[info.recipeType][info.slot]) {
        inventory[info.recipeType][info.slot] =
          inventory[info.recipeType][info.slot] + info.count;
      } else {
        inventory[info.recipeType][info.slot] = info.count;
      }
    });
  });

  return inventory;
};

const almostOneDay = 23 * 60 * 60 * 1000;

const poeNinja = async (itemType = "Currency") => {
  // Check that the data isn't too old
  if (
    poeNinjaData[itemType] &&
    Date.now() - poeNinjaData[itemType].timestamp < almostOneDay
  ) {
    return poeNinjaData[itemType].data;
  }

  const requestType = ["Currency", "Fragment"].includes(itemType)
    ? "currency"
    : "item";
  try {
    const res = await fetch(
      `https://poe.ninja/api/data/currencyoverview?league=${process.env.LEAGUE}&type=${itemType}&language=en`,
      {
        method: "GET",
        mode: "cors",
      }
    );

    // https://poe.ninja/api/data/itemoverview?league=Heist&type=Fossil&language=en

    poeNinjaData[itemType] = {
      data: (await res.json()).lines,
      timestamp: Date.now(),
    };

    return poeNinjaData[itemType].data;
  } catch (e) {
    console.log("error when fetching from poe.nonja", e);
  }

  return [];
};

const netWorthCalculator = async (tabs) => {
  //CurrencyStash;
  const specialTabs = tabs.filter(
    (tab) => !NORMAL_STASH_TABS.includes(tab.type)
  );

  const result = {};
  let chaosPerEx = -1;

  for (const tab of specialTabs) {
    if (!["CurrencyStash", "FragmentStash"].includes(tab.type)) {
      continue;
    }

    let mostExpensiveStack = { value: -1 };
    const stashTabContents = await fetchStashTabContents(tab.i);
    const stashType = tab.type.replace("Stash", "");
    const poeNinjaData = await poeNinja(stashType);

    let chaosValue = 0;
    stashTabContents.forEach(({ typeLine, stackSize }) => {
      if (typeLine === "Chaos Orb") {
        chaosValue = chaosValue + stackSize;
        return;
      }
      if (EXCLUDED_CURRENCY.includes(typeLine)) {
        return;
      }
      const a = poeNinjaData.filter((a) => a.currencyTypeName === typeLine);
      if (a.length <= 0) {
        return;
      }
      const { chaosEquivalent } = a.pop();
      if (typeLine === "Exalted Orb") {
        chaosPerEx = chaosEquivalent;
      }
      if (chaosEquivalent * stackSize < 5) {
        return;
      }

      if (mostExpensiveStack.value < chaosEquivalent * stackSize) {
        mostExpensiveStack = {
          typeLine,
          stackSize,
          value: chaosEquivalent * stackSize,
        };
      }
      chaosValue = chaosValue + chaosEquivalent * stackSize;
    });

    result[tab.i] = {
      tabName: tab.n,
      chaosValue,
      exValue: chaosValue / chaosPerEx,
      mostExpensiveStack,
    };
  }

  return result;
};

module.exports = {
  fetchStashTabs,
  fetchStashTabContents,
  chaosRecipe,
  poeNinja,
  netWorthCalculator,
};
