import Express from 'express';
import bittrex from 'node.bittrex.api';
import wrap from 'express-async-wrap';
const Router = new Express.Router();


bittrex.options = {
  apikey: 'ca50b46448ee47d089dd8f34505545b5',
  apisecret: 'bbc2abb6ad064989b5ae26a16e0e6031',
  verbose: true,
  cleartext: false,
};

export default [
  Router.get('/api/bot', wrap(async function (req, res) {
    // twitterClient.get('statuses/home_timeline', { count: 200, exclude_replies: true, include_entities: false }, (err, data, response) => {
    res.json({ yes: 'yes' });
      // res.json(data);
    // });
  })),
];

