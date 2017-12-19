import notify from '../../../utils/notify';
import BotReal from './bot-real';
// import BotPaper from './bot-paper';

const exchanges = {
  bittrex: require('../../../adapters/bittrex'),
  'bittrex-paper': require('../../../adapters/bittrex_paper'),
  // poloniex: require('../../../adapters/poloniex'),
};

const defaultOptions = {
  tickInterval: 'min',
};

export default async function (req, res) {
  const { exchange, marketOrTicknterval, isPaper } = req.params;
  let { market, tickInterval } = req.params;

  const isPaperMode = isPaper && (isPaper === 'test' || isPaper === 'paper');

  const printExamplesAndFinish = () => {
    notify(res, 'Examples:');
    notify(res, '   all pairs: /bot/stop-loss-up/bittrex/');
    notify(res, '   one pair: /bot/stop-loss-up/bittrex/BTC-EMC2');
    notify(res, '   one pair by hour: /bot/stop-loss-up/bittrex/BTC-EMC2/hour');
    notify(res, '   all pairs for hour: /bot/stop-loss-up/bittrex/hour');
    notify(res, '\r\nPossible tickInterval for bittrex: oneMin, fiveMin, thirtyMin, hour, day');
    res.status(500).end();
    return false;
  };

  // SCRIPT BODY
  if (!exchange || !exchanges[exchange]) {
    notify(res, 'ERROR. What exactly "exchange" do you want to use? (/bot/stop-loss-up/exchange/market/tickInterval)?');
    notify(res, 'Possible exchanges: bittrex, bittrex-paper, ...');
    return printExamplesAndFinish(res);
  }

  const exchangeAdapter = exchanges[exchange];
  await exchangeAdapter.init(); // TODO: add API KEY/ SECRET from user data

  if (marketOrTicknterval && exchangeAdapter.tickIntervals[marketOrTicknterval] ) {
    tickInterval = marketOrTicknterval;
    market = 'all';
  } else if (marketOrTicknterval) {
    market = marketOrTicknterval;
    tickInterval = defaultOptions.tickInterval;
  }

  // const bot = isPaperMode ? new BotPaper(exchangeAdapter, market, tickInterval) : new BotReal(exchangeAdapter, market, tickInterval);
  // const bot = new BotReal(exchangeAdapter, market, tickInterval);

  // // subscribe on events
  // bot.eventCenter.on('message', (text) => {
  //   notify(res, text);
  // });

  // bot.eventCenter.on('stop', (text) => {
  //   notify(res, text);
  //   notify(res, 'Bot stopped. Thx to all, bye!');
  //   res.status(200).end();
  //   return false;
  // });

  // bot.start();
};
