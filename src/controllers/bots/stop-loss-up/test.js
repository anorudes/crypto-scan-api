import notify from '../../../utils/notify';

const exchanges = {
  bittrex: require('../../../adapters/bittrex').default,
  // 'bittrex-paper': require('../../../adapters/bittrex_paper'),
  // poloniex: require('../../../adapters/poloniex'),
};

const defaultOptions = {
  tickInterval: 'min',
};

export default async function (req, res) {

  const exchange = exchanges.bittrex;

  // console.log(exchange );
  // const balance = await exchange.getBalances();
  // notify(res, balance);

  const history = await exchange.getOrderHistory('BTC-RLC');
  notify(res, history);


  res.end();
  // bot.start();
};
