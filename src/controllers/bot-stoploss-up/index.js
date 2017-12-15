import bittrex from 'node.bittrex.api';
import Promise from 'bluebird';

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


// bittrex.getmarketsummaries
/*
bittrex.websockets.client(function() {
  console.log('Websocket connected');
  bittrex.websockets.subscribe(['BTC-ETH'], function(data) {
    if (data.M === 'updateExchangeState') {
      data.A.forEach(function(data_for) {
        console.log('Market Update for '+ data_for.MarketName, data_for);
      });
    }
  });
});
*/

export default async function (req, res) {
    // twitterClient.get('statuses/home_timeline', { count: 200, exclude_replies: true, include_entities: false }, (err, data, response) => {

    // bittrex.getmarketsummaries( data => {
    //   res.json(data);
    // });

  let myCurrentBalance = [];
  let myOrders = [];
  let myOrdersHistory = [];
  const waitPromises = [];

  waitPromises.push(new Promise((resolve, reject) => {
    bittrex.getbalances((data, err) => {
      if (err) {
        console.error(err);
        reject();
        return false;
      }

      myCurrentBalance = data.result.filter( coin => {
        return coin.Balance > 0;
      });

      resolve();

    });
  }));

  waitPromises.push(new Promise((resolve, reject) => {
    bittrex.sendCustomRequest(`${BASE_URL_BITTREX}/market/getopenorders`, (data, err) => {
      if (err) {
        console.error(err);
        reject();
        return false;
      }
      myOrders = data.result;
      resolve();
    }, true);
  }));

  waitPromises.push(new Promise((resolve, reject) => {
    bittrex.sendCustomRequest(`${BASE_URL_BITTREX}/account/getorderhistory`, (data, err) => {
      if (err) {
        console.error(err);
        reject();
        return false;
      }
      myOrdersHistory = data.result;
      resolve();
    }, true);
  }));

  Promise.all(waitPromises).then(() => {

    res.json({
      orders: myOrders,
      myOrdersHistory: myOrdersHistory,
      balance: myCurrentBalance,
    });
  });
  // res.json({ yes: 'yes' });
};

