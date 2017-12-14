import Express from 'express';
import http from 'http';
import winston from 'winston';
import routes from './routes/';
import TwitterParser from './modules/twitterParser';
import Core from './modules/core';

const app = new Express();
const server = new http.Server(app);

const twitterParser = new TwitterParser({
  consumer_key: 'CA1M166WKQ7gkiVYrhqByKLTP',
  consumer_secret: 'XFAf6NHsyMBRT0HhVGgDB90iJIEnmd5DUUvVCf75wlBtCMOCZ6',
  access_token_key: '850801796-T3Dig8y15kRr3DrRQP1qgRwjhcr1NpWabtuVyxhX',
  access_token_secret: 'kNgrGpIIOhW3NTy1lTj1Z7vEJlLtqGYyKq2n5hl4GJNI8'
});
const core = new Core({ twitterParser });
core.init();

app.set('trust proxy', 1);
app.use(routes);
app.use((err, req, res, next) => {
  if (err) {
    winston.info('error');
    winston.info(err);
  }
  next();
});

server.listen(3080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Api is listening on http://%s:%s', host, port);
});

