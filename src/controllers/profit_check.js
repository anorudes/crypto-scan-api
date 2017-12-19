import bittrex from '../adapters/bittrex';

const exchange = bittrex;
exchange.init();

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

  Object.keys(ordersByMarket).map(name => {
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

  const openOrders = await exchange.getOpenOrders();
  const orderHistory = await exchange.getOrderHistory();

  const myOrdersProfit = historyAnalyzer(orderHistory, openOrdersAnalyzer(openOrders));

  res.json({
    myOrdersProfit,
  });

};

