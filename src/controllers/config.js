import Config from '../models/config';

export async function getConfigs(req, res) {
  const { user } = req.params.user;
  const docs = await Config.findOne({ user: 'global' });
  const userDocs = await Config.findOne({ user });

  const globalConfig = docs && docs.config && JSON.parse(docs.config);
  const userConfig = userDocs && userDocs.config && JSON.parse(userDocs.config);
  const userData = userDocs && userDocs.data && JSON.parse(userDocs.data);

  const config = globalConfig && userConfig
  ? {
    ...globalConfig,
    ...userConfig,
  } : null;
  const data = userData;

  res.json({
    config,
    data,
  });
}

export async function saveConfigs(req, res) {
  const {
    user,
    data,
    config,
  } = req.body;

  // Find global config
  const docs = await Config.findOne({ user: 'global' });
  if (!docs) {
    // Save global config
    const newConfig = new Config({
      config,
      user: 'global',
    });
    newConfig.save();
  }

  const userDocs = await Config.findOne({ user });

  if (userDocs) {
    // Update user config
    userDocs.config = config;
    userDocs.data = data;
    userDocs.save();
  } else {
    // Create new user config
    const newConfig = new Config({
      user,
      config,
      data,
    });
    newConfig.save();

    res.json({
      success: true,
    });
  }
}

