/*
 * 1. GET your BALANCES. 
 *    Prepare market list from available balances (+user filters);
 *
 * 2. Using market list to GET your ORDERS HISTORY. 
 *    Find last buy price for each market to start from it.
 *
 * 3. GET your OPEN ORDERS. 
 *    To know what orders have to be cancelled during placing new stop-loss orders
 *
 * 5. Start GET LATEST CANDLE by time interval.
 *    To check if there profit from new price according you start price and profit settings 
 *
 * 6. Placing NEW STOP LOSS ORDERS
 *    If profit target reached, cancel old order and place new stop-loss a little lower then current price
 * 
 * 7. Collecting and printing all important info. 
 *    (TODO: save it to db)
 */
import RM from '../requests_manager';
import OSNotifier from 'node-notifier';
import promiseWrap from '../../../utils/promise_wrap';

const defaultOptions = {
  CHECK_CANDLE_INTERVAL: 60 * 1000,
}
const PROFIT_TARGETS = [0, 20];              // in percents from start price
const PROFIT_STEP = 15;                   // next step after arrived profit
const STOP_LIMIT_PERCENT_UNDER = 30;       // in percents from last difference
const STOP_PRICE_PERCENT_UNDER = 31;       // in percents from last difference

class BotStopLossUp {

  constructor(exchangeAdapter, market, tickInterval) {
    this.exchangeAdapter = exchangeAdapter;
    this.market = market; // TODO — market == all;
    this.tickInterval = tickInterval;

    this.PROFIT_TARGETS = PROFIT_TARGETS;
    this.PROFIT_STEP = PROFIT_STEP;
    this.STOP_LIMIT_PERCENT_UNDER = STOP_LIMIT_PERCENT_UNDER;
    this.STOP_PRICE_PERCENT_UNDER = STOP_PRICE_PERCENT_UNDER;

    // If user wants to restrict markets to only few of them.
    this.marketAllowFilter = [];    // only these
    this.marketRestrictFilter = []; // all except these

    // Prepare object to fill during working
    this.balancesByMarket = {};
    this.markets = [];
    this.BTCamount = 0;

    this.ordersByMarket = {};
    this.openOrders = [];

    this.candleLast = {};
    this.candleBeforeLast = {};
  }

  async start() {

    // Create long targets
    for (let i = 2; i <= (500 / PROFIT_STEP); i++) { // looking forward to 500% profit:-)
      this.PROFIT_TARGETS[i] = this.PROFIT_TARGETS[i - 1] + PROFIT_STEP;
    }

    // Grabbing and parsing all starting data
    await this.checkBalances();
    await this.getOrderHistory();
    
    const limits = {};

    marketsToCheck.map( (market) => {
      limits[market] = getLatestBuyPrices(orderHistory[market], balancesByMarket[market]);
    });

    await this.getOpenOrders();

    console.log('======================================================');
    console.log('Free BTC available for buy: ', freeBTCamount);
    console.log('======================================================');
  }

  /* WORKING WITH EXCHANGE */
  async checkBalances() {
    return new Promise(async (resolve, reject) => {
      console.log('Getting actual balances...');
      const balances = await RM.push(this.exchangeAdapter.getBalances);
      const balancePlus = 0;

      balances.map(balance => {
        if (balance.Currency === 'BTC') {
          // Get free BTC amount from BTC balance
          this.BTCamount = balance.Available;
        } else if (this.marketAllowFilter.indexOf(`BTC-${balance.Currency}`) > -1 || !this.marketAllowFilter.length) {
          balancePlus++;
          this.markets.push(`BTC-${balance.Currency}`);
          this.balancesByMarket[`BTC-${balance.Currency}`] = balance;    // it's not universal to name key with 'BTC-' prefix, but it is nice for BTC-markets. :)
        }
      });      

      console.log(`Done. ${balancePlus} markets.`);
      resolve();
    });
  }

  async getOrderHistory() {
    return new Promise(async (resolve, reject) => {
      console.log('Getting orders history to check bought coins price...');

      const results = await Promise.all(this.markets.map(market => {
        return RM.push(exchange.getOrderHistory, market);
      }));

      results.map((result, index) => {
        this.ordersByMarket[this.markets[index]] = result;
      });

      console.log('Done.');
      resolve();
    });
  }

  async getLatestCandle() {

  }

  async getOpenOrders() {
    return new Promise(async (resolve, reject) => {
      console.log('Getting current open orders...');
      this.openOrders = await RM.push(exchange.getOpenOrders);
      console.log('Done.');
      resolve();
    });
  }

  /* PARSE EXCHANGE DATA */

  parseBalances


  // Get Balances list and parse it
  parseBalances() {

  }
};


export default BotStopLossUp;

// const exchange = bittrex;
const exchange = bittrex_history;




// TODO — добавить фильтр, который берется из настроек пользователя,
// чтобы  бот не за всем следил а только за тем, что ему разрашено
// TEMPORARY
// const marketAllowFilter = ['BTC-QTUM', 'BTC-EMC2'];

const parseBalances = (currentBalances, freeBTCamount) => {
};

const getOrderHistory = async (marketsToCheck) => {

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

  // const preparedData = await exchange.prepareData('BTC-EMC2', 'oneMin');

  // res.json( preparedData );


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
  // startCheckingCandles(marketsToCheck, checkForOrderChange);

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

