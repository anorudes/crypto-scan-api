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


const BASE_URL_BITTREX = 'https://bittrex.com/api/v1.1';
const BASE_URL_BITTREX_V2 = 'https://bittrex.com/Api/v2.0';

const TICK_INTERVAL = 100;

const preparedData = {};
const walkingThroughData = {};

// TODO -> get from cookies
const user = 'paper';
const defaultBTCAmount = 0.5;
const startCoinAmount = 500;

const getCandlesExecution = {};

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
  const HistoryByMarket = {
    'BTC-RLC': {
      OrderUuid: 'd0b3777e-36d2-47c3-8f27-0614bb81c96a',
      Exchange: 'BTC-RLC',
      TimeStamp: '2017-12-19T15:57:49.993',
      OrderType: 'LIMIT_BUY',
      Limit: 0.00005487,
      Quantity: 168.55989486,
      QuantityRemaining: 0,
      Commission: 0.00002311,
      Price: 0.006405276005,
      PricePerUnit: 0.000038,
      IsConditional: false,
      Condition: 'NONE',
      ConditionTarget: null,
      ImmediateOrCancel: false,
      Closed: '2017-12-19T15:57:50.117',
    },
    'BTC-RDD': {
      OrderUuid: 'd0b3777e-36d2-47c3-8f27-0614bb81c96b',
      Exchange: 'BTC-RDD',
      TimeStamp: '2017-12-19T15:57:49.993',
      OrderType: 'LIMIT_BUY',
      Limit: 0.00005487,
      Quantity: 50000,
      QuantityRemaining: 0,
      Commission: 0.00002311,
      Price: 0.0045,
      PricePerUnit: 9e-8,
      IsConditional: false,
      Condition: 'NONE',
      ConditionTarget: null,
      ImmediateOrCancel: false,
      Closed: '2017-12-19T15:57:50.117',
    },
    'BTC-STRAT': {
      OrderUuid: 'd0b3777e-36d2-47c3-8f27-0614bb81c96c',
      Exchange: 'BTC-STRAT',
      TimeStamp: '2017-12-19T15:57:49.993',
      OrderType: 'LIMIT_BUY',
      Limit: 0.00005487,
      Quantity: 500,
      QuantityRemaining: 0,
      Commission: 0.0006088,
      Price: 0.24352,
      PricePerUnit: 0.00048704,
      IsConditional: false,
      Condition: 'NONE',
      ConditionTarget: null,
      ImmediateOrCancel: false,
      Closed: '2017-12-19T15:57:50.117',
    },
    'BTC-XVG': {
      OrderUuid: 'd0b3777e-36d2-47c3-8f27-0614bb81c96d',
      Exchange: 'BTC-XVG',
      TimeStamp: '2017-12-19T15:57:49.993',
      OrderType: 'LIMIT_BUY',
      Limit: 0.00005487,
      Quantity: 500,
      QuantityRemaining: 0,
      Commission: 0.000001225,
      Price: 0.00049,
      PricePerUnit: 9.8e-7,
      IsConditional: false,
      Condition: 'NONE',
      ConditionTarget: null,
      ImmediateOrCancel: false,
      Closed: '2017-12-19T15:57:50.117',
    } };
  if (!HistoryByMarket[market]) {
    return promiseWrap(`No orders found for ${market}`);
  }
  return promiseWrap([HistoryByMarket[market]]);
};


// Get Balance
const getBalances = (market) => {
  const coinName = market.substr(4);

  const balancesDefault = [{
    Currency: 'BTC',
    Balance: defaultBTCAmount,
    Available: defaultBTCAmount,
    Pending: 0,
    CryptoAddress: null,
  }];

  if (market) {
    balancesDefault.push({
      Currency: coinName,
      Balance: startCoinAmount,
      Available: 0,
      Pending: 0,
      CryptoAddress: null,
    });
  }

  return promiseWrap(balancesDefault);
};


const getCandles = async (market, tickInterval = 'min') => {
  if (!getCandlesExecution[market]) {
    getCandlesExecution[market] = 'started';
  }
  return new Promise((resolve, reject) => {
    const candles = HistoryData.findOne({ market, tickInterval });
    if (candles) {
      console.log(`Found candles for ${market}/${tickInterval}`);
      getCandlesExecution[market] = 'finished';
      resolve(candles);
      return;
    }
    reject(`No data found for ${market}/${tickInterval}`);
  });
};


const getLatestCandle = async (market, tickInterval = 'min') => {
  return new Promise(async (resolve, reject) => {
    if (!preparedData[market] || !preparedData[market][tickInterval]) {
      let allCandles = {};
      try {
        allCandles = await getCandles(market, tickInterval);
      } catch (e) {
        reject({ code: 2, message: e });
        return false;
      }
      if (typeof preparedData[market] === 'undefined') {
        preparedData[market] = {};
        walkingThroughData[market] = {};
      }
      preparedData[market][tickInterval] = allCandles.data;
      walkingThroughData[market][tickInterval] = 1000;
    }
    const result = preparedData[market][tickInterval][walkingThroughData[market][tickInterval]];
    walkingThroughData[market][tickInterval]++;
    return resolve(result);
  });
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
  name: 'bittrex_paper',
  proxy: bittrex,
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

