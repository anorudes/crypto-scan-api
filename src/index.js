import Express from 'express';
import winston from 'winston';
import mongoose from 'mongoose';
import bluebird from 'bluebird'
import CONFIG from '../config/';
import routes from './routes/';

const app = Express();


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


app.set('trust proxy', 1);
app.use(routes);
app.use((err, req, res, next) => {
  if (err) {
    winston.info('error');
    winston.info(err);
  }
  next();
});

app.listen(CONFIG.server.port, CONFIG.server.host, () => {
  console.log('Api is listening on http://%s:%s', CONFIG.server.host, CONFIG.server.port);
});

