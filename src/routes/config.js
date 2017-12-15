import Express from 'express';
import wrap from 'express-async-wrap';
const Router = new Express.Router();

export default [
  Router.get('/api/config/:user', wrap(async function (req, res) {


  })),

  Router.post('/api/config', wrap(async function (req, res) {
    const { user } = req.body;

  })),
];
