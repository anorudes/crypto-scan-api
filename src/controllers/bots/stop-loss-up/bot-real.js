import RM from '../../../utils/requests_manager';
import OSNotifier from 'node-notifier';


// const exchange = bittrex;
// const exchange = bittrex_history;

const CHECK_CANDLE_INTERVAL = 60 * 1000;

const PROFIT_TARGETS = [0, 20];              // in percents from start price
const PROFIT_STEP = 15;                   // next step after arrived profit
const STOP_LIMIT_PERCENT_UNDER = 30;       // in percents from last difference
const STOP_PRICE_PERCENT_UNDER = 31;       // in percents from last difference


for (let i = 2; i <= (500 / PROFIT_STEP); i++) { // looking forward to 500% profit:-)
  PROFIT_TARGETS[i] = PROFIT_TARGETS[i - 1] + PROFIT_STEP;
}


// TODO — добавить фильтр, который берется из настроек пользователя,
// чтобы  бот не за всем следил а только за тем, что ему разрашено
// TEMPORARY
// const marketAllowFilter = ['BTC-QTUM', 'BTC-EMC2'];
const marketAllowFilter = [];
const marketRestrictFilter = [];

const parseBalances = (currentBalances, freeBTCamount) => {
  const marketsToCheck = [];
  const balancesByMarket = {};
  currentBalances.map(balance => {
    if (balance.Currency === 'BTC') {
      freeBTCamount = balance.Available;
    } else if (marketAllowFilter.indexOf(`BTC-${balance.Currency}`) > -1 || !marketAllowFilter.length) {
      marketsToCheck.push(`BTC-${balance.Currency}`);
      balancesByMarket[`BTC-${balance.Currency}`] = balance;    // it's not universal to name key with 'BTC-' prefix, but it is nice for BTC-markets. :)
    }
  });
  return {
    balancesByMarket,
    marketsToCheck,
    freeBTCamount,
  };
};

const getOrderHistory = async (marketsToCheck) => {
  const ordersByMarket = {};

  const results = await Promise.all(marketsToCheck.map(market => {
    return RM.push(exchange.getOrderHistory, market);
  }));

  results.map((result, index) => {
    ordersByMarket[marketsToCheck[index]] = result;
  });

  return ordersByMarket;
};

const getLatestBuyPrices = (orders, balances) => {
  let quantity = 0;
  let startPrice = 0;

  // It walks through fresh one to old one, so we can get the first one 'BUY' order and work with it.
  // TODO: find way to understand ddependancy on multiple addional 'BUY' in a row

  orders.map(order => {
    if (order.OrderType === 'LIMIT_BUY') {
      if (!startPrice) {
        startPrice = order.PricePerUnit;
      }
      quantity += order.Quantity;
    } else if (order.OrderType === 'LIMIT_SELL') {
      quantity -= order.Quantity;
    }
  });

  for (let i = 0; i < orders.length; i++ ) {
  }

  return {
    startPrice,
    lastPrice: startPrice,
    quantity,
  };
};

const checkInitialTargets = (startPrice) => {
  const priceTargets = [];
  for (let i = 0; i < PROFIT_TARGETS.length; i++) {
    priceTargets[i] = startPrice + (startPrice / 100 * PROFIT_TARGETS[i]);
  }

  // TODO find exactly profitLevel by finding multiplier of steps.
  return {
    priceTargets,
    profitLevel: 1,
    currentTarget: priceTargets[1],
  };
};

const checkCandle = async (market, cb) => {
  const lastCandle = await RM.push(exchange.getLatestCandle, market);
  cb(market, lastCandle[0]);
  setTimeout(() => {
    checkCandle(market, cb);
  }, CHECK_CANDLE_INTERVAL);
};

const startCheckingCandles = (marketsToCheck, cb) => {
  marketsToCheck.map( market => {
    checkCandle(market, cb);
  });
};

export default async function (req, res) {

  await exchange.init();
  const preparedData = await exchange.prepareData('BTC-EMC2', 'oneMin');

  // res.json( preparedData );

  let preLastCandle = {};
  console.log('Getting actual balances...');
  const balances = await RM.push(exchange.getBalances);
  let { balancesByMarket, marketsToCheck, freeBTCamount } = parseBalances(balances, 0);
  console.log('Done.');
  console.log('Getting current open orders...');
  const openOrders = await RM.push(exchange.getOpenOrders);
  console.log('Done.');
  console.log('Getting orders history to check bought coins price...');
  const orderHistory = await getOrderHistory(marketsToCheck);
  console.log('Done.');

  const limits = {};

  marketsToCheck.map( (market) => {
    limits[market] = getLatestBuyPrices(orderHistory[market], balancesByMarket[market]);
  });

  console.log('======================================================');
  console.log('Free BTC available for buy: ', freeBTCamount);
  console.log('======================================================');

  // OSNotifier.notify({
  //   title: 'StopLossUp Bot',
  //   message: `Free BTC available for buy: ${freeBTCamount}`,
  //   sound: true,
  //   wait: true,
  // });

  const checkForOrderChange = (market, lastCandle) => {
    const candlePrice = lastCandle.C; // close price
    const currentProfit = candlePrice / limits[market].startPrice * 100 - 100;
    const currentStopProfit = candlePrice / limits[market].stopPrice * 100 - 100;

    if (!limits[market].profitTarget) {
      limits[market] = {
        ...limits[market],
        ...checkInitialTargets(limits[market], candlePrice),
      };

      // TODO: check if initial STOPLOSS order exists and PUT IT IF NO
    }
    console.log(`${lastCandle.T}, ${market}, profit: ${Math.round(currentProfit * 100) / 100}%, boughtPrice: ${limits[market].startPrice}, currentPrice: ${candlePrice}, stopLoss: ${limits[market].stopPrice}/${limits[market].stopLimit} (${Math.round(currentStopProfit * 100) / 100}%)`);

    // If price difference from start > CONST, then change stop-loss order
    if (candlePrice >= limits[market].profitTarget) {
      while (candlePrice >= limits[market].profitTargets[limits[market].profitLevel]) {
        limits[market].profitLevel++;
      }
      limits[market].profitTarget = limits[market].profitTargets[limits[market].profitLevel];

      const lastPriceTarget = limits[market].priceTargets[limits[market].profitLevel - 1];
      const prevPriceTarget = limits[market].priceTargets[limits[market].profitLevel - 2];

      // SET UP LIMITS
      limits[market].stopLimit = lastPriceTarget - ((candlePrice - limits[market].lastPrice) / 100 * STOP_LIMIT_PERCENT_UNDER);
      limits[market].stopPrice = lastPriceTarget - ((candlePrice - limits[market].lastPrice) / 100 * STOP_PRICE_PERCENT_UNDER);

      limits[market].lastPrice = candlePrice;

      console.log(`${market}: PROFIT (${PROFIT_TARGETS[limits[market].profitLevel - 1]}%) ACHIEVED! (level ${limits[market].profitLevel - 1})`);
      console.log(`====> next profit ====> (${limits[market].profitTarget}%)! (level ${limits[market].profitLevel})`);
    }

    preLastCandle = lastCandle;
  };

/*
  { O: 0.00149642,
    H: 0.0015,
    L: 0.00148591,
    C: 0.00149999,
    V: 5225.46774307,
    T: '2017-12-15T20:30:00',
    BV: 7.80269322 }

*/
  startCheckingCandles(marketsToCheck, checkForOrderChange);

    // await exchange.sockets.start();

  // exchange.sockets.subscribeOnMarketsUpdate(marketsToCheck, (data) => {
  //   if (data.M === 'updateExchangeState') {
  //     data.A.forEach(function(data_for) {
  //       console.log('Market Update for '+ data_for.MarketName, data_for);
  //     });
  //   }
  // });

  res.json({
    // data: preparedData,
    // orders: openOrders,
    // latestBuyPrices,
    myOrdersHistory: orderHistory,
    balances
  });
  // res.json({ yes: 'yes' });
};

