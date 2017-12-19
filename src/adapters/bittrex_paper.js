/*
 * init()
 * getOpenOrders()
 * getOrderHistory()
 *
 *
 *
 */
import bittrex from 'node.bittrex.api';
import HistoryData from '../models/historyData';
import HistoryBalances from '../models/historyBalances';
// import jsonfile from 'jsonfile';

const API_KEY_BITTREX = 'fcb485d9c39f413591bff349df9f2fee';
const API_SECRET_BITTREX = '730c23f56b0741329d4f2e973c7af985';

const BASE_URL_BITTREX = 'https://bittrex.com/api/v1.1';
const BASE_URL_BITTREX_V2 = 'https://bittrex.com/Api/v2.0';

const TICK_INTERVAL = 100;

const preparedData = {};
const walkingThroughData = {};

// TODO -> get from cookies
const user = 'motorin';

// Set Keys And Pathes
const init = (apiKey, apiSecret) => {
  bittrex.options({
    apikey: apiKey || API_KEY_BITTREX,
    apisecret: apiSecret || API_SECRET_BITTREX,
    // stream: false,
    verbose: true,
    // cleartext: false,
    baseUrl: BASE_URL_BITTREX,
    baseUrlv2: BASE_URL_BITTREX_V2,
  });
};

const prepareData = (market, tickInterval = 'oneMin') => {
  return new Promise((resolve, reject) => {
    getCandles(market, tickInterval).then(data => {
      if (typeof preparedData[market] === 'undefined') {
        preparedData[market] = {};
        walkingThroughData[market] = {};
      }
      preparedData[market][tickInterval] = data;
      walkingThroughData[market][tickInterval] = 0;
      resolve(data);
    });
  });

};

// Async Request imitation
const promiseWrap = (result) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(result);
    }, TICK_INTERVAL);
  });
};

// Internal Middleware for custom requests
const customAsyncRequest = (url, modelToSave) => {
  return new Promise((resolve, reject) => {
    bittrex.sendCustomRequest(url, (data, err) => {
      if (err) {
        console.error(err);
        reject();
        return false;
      }
      if (modelToSave) {
        modelToSave.data = data.result;
        modelToSave.save();
      }
      resolve(data.result);
    }, true);
  });
};

// Get Current Open Orders
const getOpenOrders = (market) => {
  const result = jsonfile.readFileSync(fileNames[market].openOrders, { throws: false });
  if (!result) {
    let url = `${BASE_URL_BITTREX}/market/getopenorders`;
    if (typeof market === 'string') {
      url += `?market=${market}`;
    }

    return customAsyncRequest(url, fileNames[market].openOrders);
  }
  return promiseWrap(result);
};


// Get Order History
const getOrderHistory = (market) => {
  const result = jsonfile.readFileSync(fileNames[market].orderHistory, { throws: false });
  if (!result) {
    let url = `${BASE_URL_BITTREX}/account/getorderhistory`;
    if (typeof market === 'string') {
      url += `?market=${market}`;
    }
    return customAsyncRequest(url, fileNames[market].orderHistory);
  }
  return promiseWrap(result);
};


// Get Balance
const getBalances = () => {
  const result = jsonfile.readFileSync(fileNames.balances, { throws: false });
  if (!result) {
    return new Promise((resolve, reject) => {
      bittrex.getbalances((data, err) => {
        if (err) {
          console.error(err);
          reject();
          return false;
        }
        const myCurrentBalance = data.result.filter(coin => {
          return coin.Balance > 0;
        });
        resolve(myCurrentBalance);
      });
    });
  }
  return promiseWrap(result);
};


const getCandles = (market, tickInterval = 'oneMin') => {
  HistoryData.findOne({ market, tickInterval }, (err, result) => {
    if (result) {
      console.log(`Found candles for ${market}/${tickInterval}`);
      return promiseWrap(result);
    }

    let url = `${BASE_URL_BITTREX_V2}/pub/market/GetTicks`;
    if (typeof market !== 'string') {
      console.log('getCandles needs paramater "market"');
    }
    url += `?marketName=${market}`;
    url += `&tickInterval=${tickInterval}`;

    const historyData = new HistoryData({
      market,
      tickInterval,
      data: [],
    });
    return customAsyncRequest(url, historyData);
  });

};

const getLatestCandle = (market, tickInterval = 'oneMin') => {
  const result = preparedData[market][tickInterval][walkingThroughData[market][tickInterval]];
  walkingThroughData[market][tickInterval]++;

  return customAsyncRequest(result);
};

/*
 * WEBSOCKETS
 */
const wsStart = () => {
  return new Promise((resolve, reject) => {
    bittrex.websockets.client(() => {
      console.log('(Bittrex) Websocket connected');
      resolve();
    });
  });
};

const wsSubsribeOnMarketsUpdate = (markets, cb) => {
  bittrex.websockets.subscribe(markets, cb);
  return true;
};

const wsSubsribeOnTicketsUpdate = (markets, cb) => {
  bittrex.websockets.listen(markets, cb);
  return true;
};


export default {
  name: 'bittrex_history',
  proxy: bittrex,
  init,
  getOpenOrders,
  getOrderHistory,
  getBalances,
  getCandles,
  getLatestCandle,
  prepareData,
  sockets: {
    start: wsStart,
    subscribeOnMarketsUpdate: wsSubsribeOnMarketsUpdate,
    subscribeOnTicketsUpdate: wsSubsribeOnTicketsUpdate,
  },
};

