import Express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import bluebird from 'bluebird';
import CONFIG from '../config/';
import routes from './routes/';
import TwitterParser from './modules/twitterParser';
import Core from './modules/core';

const app = Express();

global.rootPath = __dirname;

// DB
mongoose.Promise = bluebird;
mongoose.connect(CONFIG.db.url, {
  promiseLibrary: bluebird,
  useMongoClient: true,
  socketTimeoutMS: 0,
  keepAlive: true,
  reconnectTries: 30,
}).then(dbData => {
  console.log(`DB '${dbData.name}' connected! Nice!`);
});

const twitterParser = new TwitterParser({
  consumer_key: 'CA1M166WKQ7gkiVYrhqByKLTP',
  consumer_secret: 'XFAf6NHsyMBRT0HhVGgDB90iJIEnmd5DUUvVCf75wlBtCMOCZ6',
  access_token_key: '850801796-T3Dig8y15kRr3DrRQP1qgRwjhcr1NpWabtuVyxhX',
  access_token_secret: 'kNgrGpIIOhW3NTy1lTj1Z7vEJlLtqGYyKq2n5hl4GJNI8',
});
// const core = new Core({ twitterParser });
// core.init();

app.set('trust proxy', 1);
app.use(bodyParser.json({
  limit: '50mb',
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb',
}));
app.use(routes);
app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
  }

  next();
});

app.listen(CONFIG.server.port, CONFIG.server.host, () => {
  console.log('Api is listening on http://%s:%s', CONFIG.server.host, CONFIG.server.port);
});

