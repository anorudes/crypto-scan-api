import Express from 'express';
import wrap from 'express-async-wrap';
const Router = new Express.Router();
import Config from '../models/config';

export default [
  Router.get('/api/config/:user', wrap(async function (req, res) {
    const { user } = req.params.user;
    const docs = await Config.find({ user: 'global' });
    const userDocs = await Config.find({ user });
    const globalConfig = docs && JSON.parse(docs.toJSON().config);
    const userConfig = userDocs && JSON.parse(userDocs.toJSON().config);
    const userData = userDocs && JSON.parse(docs.toJSON().data);

    const config = {
      ...globalConfig,
      ...userConfig,
    };
    const data = userData;

    res.json({
      config,
      data,
    });
  })),

  Router.post('/api/config', wrap(async function (req, res) {
    const {
      user,
      data,
      config,
    } = req.body;

    // Find global config
    const docs = await Config.find({ user: 'global' });
    if (!docs) {
      // Save global config
      const newConfig = new Config;
      newConfig.set({
        config,
        user: 'global',
      });
      newConfig.save();
    }

    const userDocs = await Config.find({ user });

    if (userDocs) {
      // Update user config
      userDocs.config = config;
      userDocs.data = data;
      userDocs.save();
    } else {
      // Create new user config
      const newConfig = new Config;

      newConfig.set({
        user,
        config,
        data,
      });
      newConfig.save();

      res.json({
        success: true,
      });
    }
  })),
];
