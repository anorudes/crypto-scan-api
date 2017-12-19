const MIN_REQUEST_INTERVAL = 1500;     // ms
let timeFromLastRequest = Date.now();  // unixtimestamp

const requestsQueue = [];

const checkQueue = async () => {
  if (requestsQueue.length && (Date.now() - timeFromLastRequest > MIN_REQUEST_INTERVAL)) {
    // console.log(`execute next in ${Date.now() - timeFromLastRequest}ms. Length: ${requestsQueue.length}`);
    const item = requestsQueue.shift();
    const result = await item.cb(item.params);
    timeFromLastRequest = new Date();
    item.resolve(result);
  }
};

const push = (cb, params) => {
  return new Promise((resolve, reject) => {
    return requestsQueue.push({ cb, params, resolve, reject });
  });
};

export default {
  push,
};


// Start timer
const requestsTimer = setInterval(() => { checkQueue(); }, MIN_REQUEST_INTERVAL);
