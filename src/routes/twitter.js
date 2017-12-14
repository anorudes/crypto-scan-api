import Express from 'express';
import wrap from 'express-async-wrap';
const Router = new Express.Router();

export default [
  Router.get('/api/twitter', wrap(async function (req, res) {
    const { hours } = req.query;

    // get from db feed for last hours

  })),
];
