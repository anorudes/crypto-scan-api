import Express from 'express';
import wrap from 'express-async-wrap';

import botStopLossUp from '../controllers/bots/stop-loss-up';
import botStopLossUpTest from '../controllers/bots/stop-loss-up/test';
import botGrabData from '../controllers/bots/grab-data';

import profitCheck from '../controllers/profit_check';
import twitter from '../controllers/twitter';
import { getConfigs, saveConfigs } from '../controllers/config';

const Router = new Express.Router();

export default [
  // Config
  Router.get('/api/config/:user', wrap(getConfigs)),
  Router.post('/api/config', wrap(saveConfigs)),

  // Twitter
  Router.get('/api/twitter', wrap(twitter)),

  // Check Your Own Profit
  Router.get('/api/profit_check', wrap(profitCheck)),

  // Bot For Settings StopLoss higher in auto mode
  Router.get('/api/bot/stop-loss-up/', wrap(botStopLossUp)),
  Router.get('/api/bot/stop-loss-up/:exchange/:marketOrTicknterval', wrap(botStopLossUp)),
  Router.get('/api/bot/stop-loss-up/:exchange/:market/:tickInterval/', wrap(botStopLossUp)),
  Router.get('/api/bot/stop-loss-up/:exchange/:market/:tickInterval/:isPaper', wrap(botStopLossUp)),

  // TODO: remove it
  Router.get('/api/bot/stop-loss-up/test', wrap(botStopLossUpTest)),
  Router.get('/api/bot/stop-loss-up/*', wrap(botStopLossUp)),


  Router.get('/api/bot/grab/:exchange/:market/:tickInterval', wrap(botGrabData)),
  Router.get('/api/bot/grab/*', wrap(botGrabData)),

  // Bot For re-buy at the same price after sell by stop-loss order
  // Router.get('/api/bot/rebuy', wrap(botStopLossUp)),
];
