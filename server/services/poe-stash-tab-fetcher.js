const fetch = require("node-fetch");

const poeItems = require("./poe-items");

const fetchStashTabNames = async () => {
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
    return { slot: "unknown", count: 0 };
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

  const { properties } = item;
  if (properties[1].name === "Physical Damage") {
    let count = 0.5;

    if (
      twoHandedWeapons.some((a) => properties[0].name.toLowerCase().includes(a))
    ) {
      count = 1;
    }

    return { slot: "weapon", count };
  }

  return { slot: "unknown", count: 0 };
};

const recipeInfo = (item) => {
  if (item.identified) {
    return null;
  }

  const { slot, count } = getItemType(item);

  if (slot === "unknown") {
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

const chaosRecipe = async () => {
  const tabNames = await fetchStashTabNames();

  const chaosRecipeTabs = tabNames.filter((tab) => tab.n.includes("chaos_"));

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

module.exports = {
  fetchStashTabNames,
  fetchStashTabContents,
  chaosRecipe,
};
