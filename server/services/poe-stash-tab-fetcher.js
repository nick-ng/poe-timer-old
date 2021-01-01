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
const POE_NINJA_CURRENCY = ["Currency", "Fragment"];
const POE_NINJA_ITEM = [
  "DeliriumOrb",
  "Watchstone",
  "Oil",
  // "Incubator",
  "Scarab",
  "Fossil",
  "Resonator",
  "Essence",
  "DivinationCard",
  // "Prophecy",
  // "SkillGem",
];
const NON_CURRENCY_THRESHOLD = 0.5;

const poeNinjaData = {
  timestamp: 0,
  data: [],
};

const fetchStashTabs = async (credentials = {}) => {
  const { account, league, poesessid } = credentials;
  const res = await fetch(
    `https://www.pathofexile.com/character-window/get-stash-items?accountName=${account}&realm=pc&league=${league}&tabs=1`,
    {
      credentials: "include",
      headers: {
        cookie: `POESESSID=${poesessid}`,
      },
      method: "GET",
    }
  );

  try {
    const jsonRes = await res.json();
    if (jsonRes?.error) {
      console.log("[stash] error when fetching tab names", jsonRes);
      return [];
    }

    const { tabs } = jsonRes;

    return tabs;
  } catch (e) {
    console.log("[stash] error when fetching tab names", e);
    return [];
  }
};

const fetchStashTabContents = async (tabId, credentials = {}) => {
  const { account, league, poesessid } = credentials;
  const res = await fetch(
    `https://www.pathofexile.com/character-window/get-stash-items?accountName=${account}&realm=pc&league=${league}&tabIndex=${tabId}`,
    {
      credentials: "include",
      headers: {
        cookie: `POESESSID=${poesessid}`,
      },
      method: "GET",
    }
  );

  try {
    const jsonRes = await res.json();
    const { items } = jsonRes;
    return items || [];
  } catch (e) {
    console.log("[stash] error when fetching tab contents", e);
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

  console.log("[stash] Unknown item", item);
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

const chaosRecipe = async (tabs = [], credentials = {}) => {
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
    chaosRecipeTabs.map((tab) => fetchStashTabContents(tab.i, credentials))
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

const poeNinjaRefreshAge = 2 * 60 * 60 * 1000;

const poeNinja = async (credentials = {}) => {
  const { league } = credentials;
  // Check that the data isn't too old
  if (Date.now() - poeNinjaData.timestamp < poeNinjaRefreshAge) {
    return poeNinjaData.data;
  }

  poeNinjaData.data = [];
  poeNinjaData.timestamp = Date.now();
  console.log(`${new Date()} Fetching poe.ninja data`);

  for (const type of POE_NINJA_CURRENCY) {
    const requestType = "currency";
    try {
      const res = await fetch(
        `https://poe.ninja/api/data/${requestType}overview?league=${league}&type=${type}&language=en`,
        {
          method: "GET",
          mode: "cors",
        }
      );
      const resJson = await res.json();

      poeNinjaData.data = poeNinjaData.data.concat(
        resJson.lines.map((a) => ({
          ...a,
          typeLine: a.currencyTypeName,
          each: a.chaosEquivalent,
        }))
      );
    } catch (e) {
      console.log("[stash] error when fetching from poe.ninja", e);
    }
  }

  for (const type of POE_NINJA_ITEM) {
    const requestType = "item";
    try {
      const res = await fetch(
        `https://poe.ninja/api/data/${requestType}overview?league=${league}&type=${type}&language=en`,
        {
          method: "GET",
          mode: "cors",
        }
      );
      const resJson = await res.json();

      poeNinjaData.data = poeNinjaData.data.concat(
        resJson.lines
          .map((a) => ({
            ...a,
            typeLine: a.name,
            each: a.chaosValue,
          }))
          .filter((a) => a.each > NON_CURRENCY_THRESHOLD)
      );
    } catch (e) {
      console.log("[stash] error when fetching from poe.ninja", e);
    }
  }

  return poeNinjaData.data;
};

const netWorthCalculator = async (tabs, credentials = {}) => {
  //CurrencyStash;
  const specialTabs = tabs.filter(
    (tab) => !NORMAL_STASH_TABS.includes(tab.type)
  );

  const result = [];
  let chaosPerEx = -1;
  const a = (await poeNinja(credentials)).filter(
    (a) => a.typeLine === "Exalted Orb"
  );
  if (a.length > 0) {
    const { each } = a.pop();
    chaosPerEx = each;
  }

  for (const tab of specialTabs) {
    if (
      ![
        "CurrencyStash",
        "FragmentStash",
        "DivinationCardStash",
        "DelveStash",
        "EssenceStash",
        "MetamorphStash",
        "BlightStash",
        "DeliriumStash",
      ].includes(tab.type)
    ) {
      console.log("[stash] Unhandled tab.type", tab.type);
      continue;
    }

    let mostExpensiveStack = { value: -1 };
    const stashTabContents = await fetchStashTabContents(tab.i, credentials);
    const priceData = await poeNinja(credentials);

    let chaosValue = 0;
    stashTabContents.forEach((item) => {
      const { typeLine, stackSize } = item;
      if (typeLine === "Chaos Orb") {
        chaosValue = chaosValue + stackSize;
        return;
      }
      if (EXCLUDED_CURRENCY.includes(typeLine)) {
        return;
      }
      const a = priceData.filter((a) => a.typeLine === typeLine);
      if (a.length <= 0) {
        return;
      }
      const { each } = a.pop();

      if (typeLine === "Exalted Orb") {
        chaosPerEx = each;
      }
      if (each * stackSize < 5) {
        return;
      }

      if (mostExpensiveStack.value < each * stackSize) {
        mostExpensiveStack = {
          typeLine,
          stackSize,
          value: each * stackSize,
        };
      }
      chaosValue = chaosValue + each * stackSize;
    });

    result.push({
      tabName: tab.n,
      chaosValue,
      exValue: chaosValue / chaosPerEx,
      mostExpensiveStack,
    });
  }

  return {
    tabs: result,
    timestamp: Date.now(),
  };
};

module.exports = {
  fetchStashTabs,
  fetchStashTabContents,
  chaosRecipe,
  poeNinja,
  netWorthCalculator,
};
