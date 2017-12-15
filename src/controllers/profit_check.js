import bittrex from 'node.bittrex.api';


const API_KEY_BITTREX = 'fcb485d9c39f413591bff349df9f2fee';
const API_SECRET_BITTREX = '730c23f56b0741329d4f2e973c7af985';

const BASE_URL_BITTREX = 'https://bittrex.com/api/v1.1';
const BASE_URL_BITTREX_V2 = 'https://bittrex.com/Api/v2.0';

bittrex.options({
  apikey: API_KEY_BITTREX,
  apisecret: API_SECRET_BITTREX,
  // stream: false,
  verbose: true,
  // cleartext: false,
  baseUrl: BASE_URL_BITTREX,
  baseUrlv2: BASE_URL_BITTREX_V2,
});


const openOrdersAnalyzer = (data) => {
  const openOrdersByMarket = {};
  data.map((order) => {
    if (order.Exchange.substr(0, 4) !== 'BTC-') {
      return false;
    }
    if (typeof openOrdersByMarket[order.Exchange] === 'undefined') {
      openOrdersByMarket[order.Exchange] = {
        future_sell_orders: 0,
        profit_with_future_sell: 0,
        history: [],
      };
      if (order.OrderType === 'LIMIT_SELL') {
        console.log(order.Exchange);
        openOrdersByMarket[order.Exchange].future_sell_orders++;
        openOrdersByMarket[order.Exchange].profit_with_future_sell += (order.Limit * order.Quantity);
      }
    }
  });
  return openOrdersByMarket;
};

const historyAnalyzer = (data, openOrders) => {
  const ordersByMarket = {};
  let total_profit = 0;
  let total_profit_with_future_sell = 0;

  data.map((order) => {
    if (order.Exchange.substr(0, 4) !== 'BTC-') {
      return false;
    }

    if (typeof ordersByMarket[order.Exchange] === 'undefined') {
      ordersByMarket[order.Exchange] = {
        profit: 0,
        buy_orders: 0,
        sell_orders: 0,
        profit_with_future_sell: 0,
        profit_with_now_sell: 0,
        history: [],
      };
    }

    if (order.OrderType === 'LIMIT_BUY') {
      ordersByMarket[order.Exchange].buy_orders++;
      ordersByMarket[order.Exchange].profit -= order.Price - order.Commission;
      total_profit -= order.Price - order.Commission;
    } else if (order.OrderType === 'LIMIT_SELL') {
      ordersByMarket[order.Exchange].sell_orders++;
      ordersByMarket[order.Exchange].profit += order.Price - order.Commission;
      total_profit += order.Price - order.Commission;
    }

    ordersByMarket[order.Exchange].history.push(order);
  });

  console.log('yes!');
  Object.keys(ordersByMarket).map(name => {
    console.log('==', name);
    if (typeof openOrders[name] !== 'undefined') {
      ordersByMarket[name].profit_with_future_sell = ordersByMarket[name].profit + openOrders[name].profit_with_future_sell;
    }
    total_profit_with_future_sell += ordersByMarket[name].profit_with_future_sell;
  });

  return {
    total_profit,
    total_profit_with_future_sell,
    ordersByMarket,
  };
};


export default async function (req, res) {

  let myOrdersProfit = [];
  let myOrders = {};
  const waitPromises = {
    open: false,
    history: false,
  };
  const waitPromisesArray = [];

  // waitPromises.push(new Promise((resolve, reject) => {
  //   bittrex.sendCustomRequest(`${BASE_URL_BITTREX}/market/getopenorders`, (data, err) => {
  //     if (err) {
  //       console.error(err);
  //       reject();
  //       return false;
  //     }
  //     myOrders = data.result;
  //     resolve();
  //   }, true);
  // }));

  await new Promise((resolve, reject) => {
    bittrex.sendCustomRequest(`${BASE_URL_BITTREX}/market/getopenorders`, (data, err) => {
      if (err) {
        console.error(err);
        reject();
        return false;
      }
      myOrders = openOrdersAnalyzer(data.result);
      resolve();
    }, true);
  });
  await new Promise((resolve, reject) => {
    bittrex.sendCustomRequest(`${BASE_URL_BITTREX}/account/getorderhistory`, (data, err) => {
      if (err) {
        console.error(err);
        reject();
        return false;
      }
      myOrdersProfit = historyAnalyzer(data.result, myOrders);
      resolve();
    }, true);
  });

  res.json({
    myOrdersProfit,
  });

};

