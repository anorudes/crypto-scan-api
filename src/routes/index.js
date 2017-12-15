import Express from 'express';
import wrap from 'express-async-wrap';

import botStopLossUp from '../controllers/bot-stoploss-up/';
import profitCheck from '../controllers/profit_check';
import twitter from '../controllers/twitter';

const Router = new Express.Router();

export default [
  // Twitter
  Router.get('/api/twitter', wrap(twitter)),

  // Check Your Own Profit
  Router.get('/api/profit_check', wrap(profitCheck)),

  // Bot For Settings StopLoss higher in auto mode
  Router.get('/api/bot/high', wrap(botStopLossUp)),

  // Bot For re-buy at the same price after sell by stop-loss order
  // Router.get('/api/bot/rebuy', wrap(botStopLossUp)),

];
