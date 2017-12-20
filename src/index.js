import Express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import bluebird from 'bluebird';
import CONFIG from '../config/';
import routes from './routes/';
import axios from 'axios';
import FeedBot from './controllers/bots/feedBot';

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

const feedBot = new FeedBot();
feedBot.start();

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

