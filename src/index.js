import Express from 'express';
import http from 'http';
import winston from 'winston';
import routes from './routes/';

const app = new Express();
const server = new http.Server(app);

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

