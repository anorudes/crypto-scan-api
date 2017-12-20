import Express from 'express';
import wrap from 'express-async-wrap';

import botStopLossUp from '../controllers/bots/stop-loss-up';
import botGrabData from '../controllers/bots/grab-data';

import { updateFeedBotConfig } from '../controllers/feed.js';
import profitCheck from '../controllers/profit_check';
import { getConfigs, saveConfigs } from '../controllers/config';

const Router = new Express.Router();

export default [
  // Config
  Router.get('/api/config/:user', wrap(getConfigs)),
  Router.post('/api/config', wrap(saveConfigs)),


  // Check Your Own Profit
  Router.get('/api/profit_check', wrap(profitCheck)),

  // Bot For Settings StopLoss higher in auto mode
  Router.get('/api/bot/stop-loss-up/', wrap(botStopLossUp)),
  Router.get('/api/bot/stop-loss-up/:exchange/:marketOrTicknterval', wrap(botStopLossUp)),
  Router.get('/api/bot/stop-loss-up/:exchange/:market/:tickInterval/', wrap(botStopLossUp)),
  Router.get('/api/bot/stop-loss-up/:exchange/:market/:tickInterval/:isPaper', wrap(botStopLossUp)),

  Router.get('/api/bot/grab/:exchange/:market/:tickInterval', wrap(botGrabData)),
  Router.get('/api/bot/grab/*', wrap(botGrabData)),

  // Feed bot
  Router.post('/api/bot/feed/config', wrap(updateFeedBotConfig)),
  // Bot For re-buy at the same price after sell by stop-loss order
  // Router.get('/api/bot/rebuy', wrap(botStopLossUp)),
];
