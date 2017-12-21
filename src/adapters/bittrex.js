/*
 * init()
 * getOpenOrders()
 * getOrderHistory()
 *
 *
 *
 */
import bittrex from 'node.bittrex.api';

const API_KEY_BITTREX = 'fcb485d9c39f413591bff349df9f2fee';
const API_SECRET_BITTREX = '730c23f56b0741329d4f2e973c7af985';

const BASE_URL_BITTREX = 'https://bittrex.com/api/v1.1';
const BASE_URL_BITTREX_V2 = 'https://bittrex.com/Api/v2.0';

const tickIntervals = {
  min: 'oneMin',
  min5: 'fiveMin',
  min30: 'thirtyMin',
  hour1: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
};

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

// Internal Middleware for custom requests
const customAsyncRequest = url => {
  return new Promise((resolve, reject) => {
    bittrex.sendCustomRequest(url, (data, err) => {
      if (err) {
        console.error(err);
        reject(err);
        return false;
      }
      resolve(data.result);
    }, true);
  });
};

// Get Current Open Orders
const getOpenOrders = (market) => {
  let url = `${BASE_URL_BITTREX}/market/getopenorders`;
  if (typeof market === 'string') {
    url += `?market=${market}`;
  }

  return customAsyncRequest(url);
};


// Get Order History
const getOrderHistory = (market) => {
  let url = `${BASE_URL_BITTREX}/account/getorderhistory`;
  if (typeof market === 'string') {
    url += `?market=${market}`;
  }
  return customAsyncRequest(url);
};


// Get Balance
const getBalances = () => {
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
};


const getCandles = (market, tickInterval = 'min') => {
  let url = `${BASE_URL_BITTREX_V2}/pub/market/GetTicks`;
  if (typeof market !== 'string') {
    console.log('getCandles needs paramater "market"');
  }
  url += `?marketName=${market}`;
  url += `&tickInterval=${tickInterval}`;
  return customAsyncRequest(url);
};

const getLatestCandle = (market, tickInterval = 'min') => {
  let url = `${BASE_URL_BITTREX_V2}/pub/market/GetLatestTick`;
  if (typeof market !== 'string') {
    console.log('getLatestCandle needs paramater "market"');
  }
  url += `?marketName=${market}`;
  url += `&tickInterval=${tickInterval}`;
  return customAsyncRequest(url);
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
  name: 'bittrex',
  proxy: bittrex,
  tickIntervals,
  init,
  getOpenOrders,
  getOrderHistory,
  getBalances,
  getCandles,
  getLatestCandle,
  sockets: {
    start: wsStart,
    subscribeOnMarketsUpdate: wsSubsribeOnMarketsUpdate,
    subscribeOnTicketsUpdate: wsSubsribeOnTicketsUpdate,
  },
};

