export const wait = (ms) =>
  new Promise((resolve, _reject) => {
    setTimeout(resolve, ms);
  });
