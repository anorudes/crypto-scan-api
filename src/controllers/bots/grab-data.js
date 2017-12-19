import HistoryData from '../../models/historyData';
// import HistoryBalances from '../../models/historyBalances';
import notify from '../../utils/notify';
import promiseWrap from '../../utils/promise_wrap';

export default async function (req, res) {


  const { exchange, market, tickInterval } = req.params;
  if (!exchange || !market || !tickInterval ) {
    notify(res, 'ERROR. Where is necessary parameters (./exchange/market/tickInterval)?', req.params);
    notify(res, 'Example: /bot/grab/bittrex/BTC-XMR/oneMin');
    notify(res, '(tickInterval for bittrex: oneMin, fiveMin, thirtyMin, hour, day)');
    res.status(500).end();
    return false;
  }

  const label = `${exchange}/${market}/${tickInterval}`;
  const exchangeAdapter = require(`../../adapters/${exchange}`).default;
  const exchangeTickInterval = exchangeAdapter.tickIntervals[tickInterval];

  if (!exchangeTickInterval) {
    notify(res, `ERROR. Parameter tickInterval (yours: '${tickInterval}')can be only one of follow:`);
    notify(res, 'min, min5, min15, min30, hour, day, week, month');
    res.status(500).end();
  }
  // const tickInterval = tickIntervalsByMarket[exchange][tickIntervalFromUser]; // wanna use standart ticked interval


  notify(res, `Start grabbing data for ${label}`);

  // Candles
  const grabAndSaveCandles = async () => {
    try {
      const candlesData = await exchangeAdapter.getCandles(market, exchangeTickInterval);
      if (!candlesData) {
        return promiseWrap(`Can't grab data for ${label}`);
      } 

      notify(res, `Successful grabbing for ${label}`);

      const candlesHistory = await HistoryData.findOrCreate({
        exchange,
        market,
        tickInterval,
      });

      candlesHistory.data = candlesData;
      candlesHistory.save();

      return promiseWrap(`Saved from ${label}`);
    } catch (err) {
      const error = err && err.message ? `\r\nError: ${err.message}` : 'Some error ocurred :-(';
      return promiseWrap(error);
    }
  };

  const result = await grabAndSaveCandles();
  notify(res, result);

  res.status(200).end();
};
