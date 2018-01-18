import Express from 'express';
import wrap from 'express-async-wrap';

import { updateFeedBotConfig } from '../controllers/feed.js';
import { getConfigs, saveConfigs } from '../controllers/config';

const Router = new Express.Router();

export default [
  // Config
  Router.get('/api/config/:user', wrap(getConfigs)),
  Router.post('/api/config', wrap(saveConfigs)),

  // Feed bot
  Router.post('/api/bot/feed/config', wrap(updateFeedBotConfig)),
];
