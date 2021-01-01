export const PLAYER_NAME = "POE_PLAYER_NAME";
export const LEAGUE = "POE_LEAGUE";
export const ACCOUNT = "POE_ACCOUNT";
export const POESESSID = "POE_POESESSID";

export const wait = (ms) =>
  new Promise((resolve, _reject) => {
    setTimeout(resolve, ms);
  });

export const updateCredentials = (forceUpdate = false) => {
  const league = localStorage.getItem(LEAGUE);
  const account = localStorage.getItem(ACCOUNT);
  const poesessid = localStorage.getItem(POESESSID);

  if (league && account && poesessid) {
    fetch("/api/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        league,
        account,
        poesessid,
        forceUpdate,
      }),
    });
  }
};
