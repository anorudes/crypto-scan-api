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

/*
 * Possible events:
 * - start
 * - log
 * - market-info
 * - profit
 * - stop
 *
 *
 *
 */


import { EventEmitter } from 'events';
import OSNotifier from 'node-notifier';
import RM from '../../../utils/requests_manager';
import promiseWrap from '../../../utils/promise_wrap';

const defaultOptions = {
  CHECK_CANDLE_INTERVAL: 60 * 1000,
  CHECK_CANDLE_INTERVAL_PAPER: 0,
};

const PROFIT_TARGETS = [0, 20];              // in percents from start price
const PROFIT_STEP = 10;                   // next step after arrived profit
const STOP_LIMIT_DIFF_PERCENT_UNDER = 30;       // in percents from last difference
const STOP_PRICE_DIFF_PERCENT_UNDER = 31;       // in percents from last difference

class BotStopLossUp extends EventEmitter {

  constructor(exchangeAdapter, market, tickInterval, isPaperMode = false) {
    super();

    this.exchangeAdapter = exchangeAdapter;
    this.market = market; // TODO — market == all;
    this.tickInterval = tickInterval;
    this.isPaperMode = isPaperMode;
    this.buyMode = false;   // boolean to switch mode from setting new stop-loss order, or buy by the price of last stop-loss order

    this.PROFIT_TARGETS = PROFIT_TARGETS;
    this.PROFIT_STEP = PROFIT_STEP;
    this.STOP_LIMIT_DIFF_PERCENT_UNDER = STOP_LIMIT_DIFF_PERCENT_UNDER;
    this.STOP_PRICE_DIFF_PERCENT_UNDER = STOP_PRICE_DIFF_PERCENT_UNDER;

    this.CHECK_CANDLE_INTERVAL = isPaperMode ? defaultOptions.CHECK_CANDLE_INTERVAL_PAPER : defaultOptions.CHECK_CANDLE_INTERVAL;

    // If user wants to restrict markets to only few of them.
    this.marketAllowFilter = [];    // only these
    this.marketRestrictFilter = []; // all except these

    // Prepare object to fill during working
    this.balancesByMarket = {};
    this.markets = [];
    this.BTCamount = 0;

    this.ordersByMarket = {};
    this.openOrders = [];

    this.limits = {};
    this.priceTargets = {};

    this.candlesIntervals = {};
    this.candleLast = {};
    this.candleBeforeLast = {};
  }

  async start() {

    // Create long targets (-> 500%)
    for (let i = 2; i <= (5000 / PROFIT_STEP); i++) { // looking forward to 500% profit:-)
      this.PROFIT_TARGETS[i] = this.PROFIT_TARGETS[i - 1] + PROFIT_STEP;
    }

    // Grabbing and parsing all starting data
    await this.checkBalances();
    await this.getOrderHistory();
    await this.getLatestBuyPrices();

    // TODO: check exists orders for having possibility to cancel them
    // await this.getOpenOrders();

    this.emit('info',
      `======================================================
      Free BTC available for buy: ${this.BTCamount}
      ======================================================`,
    );
    this.markets.map(market => {
      this.emit('info', `Start price for ${market}: ${this.limits[market].startPrice}`);
    });

    this.startCheckingCandles();
  }

  async finish(market) {
    if (this.candleLast[market]) {
      this.emit('log',
        `Start Price: ${this.limits[market].startPrice}

         Last Price: ${this.limits[market].lastPrice}
         Last Price Profit: ${this.limits[market].stopPrice / this.limits[market].startPrice * 100}%

         Last StopLoss: ${this.limits[market].stopPrice}
         Last StopLoss Profit: ${this.limits[market].stopPrice / this.limits[market].startPrice * 100}%
        `,
      );

      this.emit('stop');
    }
  }

  /* WORKING WITH EXCHANGE */
  async checkBalances() {
    return new Promise(async (resolve, reject) => {
      this.emit('log', 'Getting actual balances...');
      const balances = await RM.push(this.exchangeAdapter.getBalances, this.market);
      let balancePlus = 0;

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

      this.emit('log', `Done. ${balancePlus} markets.`);
      resolve();
    });
  }

  async getOrderHistory() {
    return new Promise(async (resolve, reject) => {
      this.emit('log', 'Getting orders history to check bought coins price...');
      let ordersAmount = 0;

      const results = await Promise.all(this.markets.map(market => {
        return RM.push(this.exchangeAdapter.getOrderHistory, market);
      }));

      results.map((result, index) => {
        ordersAmount++;
        this.ordersByMarket[this.markets[index]] = result;
      });

      this.emit('log', `Done. ${ordersAmount} orders found.`);
      resolve();
    });
  }

  async getLatestBuyPrices() {
    this.markets.map(market => {
      let quantity = 0;
      let startPrice = 0;

      this.ordersByMarket[market].map(order => {
        if (order.OrderType === 'LIMIT_BUY') {
          if (!startPrice) {
            startPrice = order.PricePerUnit;
          }
          quantity += order.Quantity;
        } else if (order.OrderType === 'LIMIT_SELL') {
          quantity -= order.Quantity;
        }
      });

      // It walks through fresh one to old one, so we can get the first one 'BUY' order and work with it.
      // TODO: find way to understand ddependancy on multiple addional 'BUY' in a row

      for (let i = 0; i < this.ordersByMarket.length; i++) {
      }

      this.limits[market] = {
        startPrice,
        lastPrice: startPrice,
        quantity,
      };

    });
    return promiseWrap();
  }

  async getOpenOrders() {
    return new Promise(async (resolve, reject) => {
      this.emit('log', 'Getting current open orders...');
      this.openOrders = await RM.push(this.exchangeAdapter.getOpenOrders);
      this.emit('log', 'Done.');
      resolve();
    });
  }

  async checkInitialTargets(market) {
    const priceTargets = [];
    for (let i = 0; i < this.PROFIT_TARGETS.length; i++) {
      priceTargets[i] = this.limits[market].startPrice + (this.limits[market].startPrice / 100 * this.PROFIT_TARGETS[i]);
    }

    // TODO find exactly profitLevel by finding multiplier of steps.
    // use var `${this.candleLast[market]}`

    return {
      priceTargets,
      profitLevel: 1,
      currentTarget: priceTargets[1],
    };
  }


  /* WORKING WITH CANDLES */

  async startCheckingCandles() {
    this.markets.map(market => {
      this.checkCandle(market);
    });
  }

  async checkCandle(market) {
    setTimeout(async () => {
      try {
        const latestCandle = await RM.push(this.exchangeAdapter.getLatestCandle, market, this.tickInterval);
        if (latestCandle) {
          this.candleLast[market] = latestCandle;
          this.checkIfOrdersHaveToChange(market);
          this.checkCandle(market);
        } else if (this.isPaperMode) {
          this.emit('log', 'There are no more candle data there.');
          this.finish(market);
        } else {
          this.emit('log', `Error: no more data for ${market}`);
          this.finish(market);
        }
      } catch (e) {
        console.log('here', e);
        this.checkCandle(market);
      }
    }, this.CHECK_CANDLE_INTERVAL);
  }

  async checkIfStopLossFired(market) {

  }

  // Main function TO CHECK IF WE NEED TO CHANGE ORDERS
  async checkIfOrdersHaveToChange(market) {
    let limit = this.limits[market];
    const candlePrice = this.candleLast[market].C; // close price
    const candleLow = this.candleLast[market].L    // low price
    const currentProfit = candlePrice / limit.startPrice * 100 - 100;
    const currentStopProfit = candlePrice / limit.stopPrice * 100 - 100;

    if (!limit.currentTarget) {
      limit = {
        ...limit,
        ...await this.checkInitialTargets(market),
      };

      // TODO: check if initial STOPLOSS order exists and PUT IT IF NO
    }
    // console.log(`${this.candleLast[market].T}, ${market}, profit: ${Math.round(currentProfit * 100) / 100}%, boughtPrice: ${limit.startPrice}, currentPrice: ${candlePrice}, stopLoss: ${limit.stopPrice}/${limit.stopLimit} (${Math.round(currentStopProfit * 100) / 100}%)`);

    if (this.buyMode && candlePrice >= limit.stopPrice) {
      // If we already sold this coin by stop-loss, but price is going up and reach our stop-loss limit
      // In this case we have to try buy this coin again (the same amount)

      this.emit('log', `${market}, ${this.candleLast[market].T}: RETURN IN GAME! Buy all coins by ${limit.stopLimit} :-\\`);
      this.buyMode = false;


    } else if (candlePrice >= limit.currentTarget) {
      // If price difference from start > CONST, then change stop-loss order

      // Profit
      // Setting up new targets

      while (candlePrice >= limit.priceTargets[limit.profitLevel]) {
        limit.profitLevel++;
      }
      limit.currentTarget = limit.priceTargets[limit.profitLevel];

      const lastPriceTarget = limit.priceTargets[limit.profitLevel - 1];
      // const prevPriceTarget = limit.priceTargets[limit.profitLevel - 2];

      // SET UP LIMITS
      limit.stopLimit = lastPriceTarget - ((candlePrice - limit.lastPrice) / 100 * STOP_LIMIT_DIFF_PERCENT_UNDER);
      limit.stopPrice = lastPriceTarget - ((candlePrice - limit.lastPrice) / 100 * STOP_PRICE_DIFF_PERCENT_UNDER);

      limit.lastPrice = candlePrice;

      this.emit('profit',
        `${market}, ${this.candleLast[market].T}: PROFIT (${PROFIT_TARGETS[limit.profitLevel - 1]}%) ACHIEVED! (level ${limit.profitLevel - 1})
        ====> new stop-loss ====> Stop: ${limit.stopLimit}, Limit: ${limit.stopPrice}
        ====> next profit ====> ${PROFIT_TARGETS[limit.profitLevel]}, ${limit.currentTarget}! Level ${limit.profitLevel}`
      );
    } else if (!this.buyMode && candleLow <= limit.stopPrice) {
      // Price fall down lower than our StopLossOrder. So, we sold it out.
      // TODO IMPORTANT: check actual balance, if order was accepted! 
      // We have to check actual balance, to understand (may be price)

      this.emit('log', `${market}, ${this.candleLast[market].T}: STOP-LOSS. Sold all coins by ${limit.stopPrice} :-\\`);
      // this.checkIfStopLossFired(market);
      this.buyMode = true;
    }

    this.limits[market] = limit;
    // MM... what is this for? I forgot :-(
    this.candleBeforeLast[market] = this.candleLast[market];


  }

  /* PARSE EXCHANGE DATA */

  // Get Balances list and parse it
  parseBalances() {

  }
};

export default BotStopLossUp;