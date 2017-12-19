const TICK_INTERVAL = 100;

// Async Request imitation
const promiseWrap = (result) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(result);
    }, TICK_INTERVAL);
  });
};

export default promiseWrap;