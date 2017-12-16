import Config from '../models/config';
import CoinData from '../models/coinData';

export async function getConfigs(req, res) {
  const { user } = req.params;
  const docs = await Config.findOne();
  const globalConfig = docs && docs.config && JSON.parse(docs.config);
  const coinsData = await CoinData.find({ user });

  const data = {};
  coinsData.map(coinData => {
    data[coinData.id] = coinData.data;
  });

  res.json({
    config: globalConfig,
    data,
  });
}

export async function saveConfigs(req, res) {
  const {
    config,
    data,
    user,
  } = req.body;

  // Find global config
  const docs = await Config.findOne();

  if (docs && docs.config) {
    // Update global config
    const prevConfig = JSON.parse(docs.config);
    docs.config = JSON.stringify({
      ...config, // new fields
      ...prevConfig, // return prev fields from global config
      list: [ // update list
        ...prevConfig.list,
        ...config.list,
      ],
    });

    docs.save();
  } else {
    // Save global config
    const newConfig = new Config({
      config: JSON.stringify(config),
    });
    newConfig.save();
  }

  // Save coin data
  const updatedCoinsId = {};
  const coinsData = await CoinData.find({ user });

  // Update coindata
  coinsData.map(coinData => {
    if (data[coinData.id]) {
      coinData.data = data[coinData.id];
      coinData.save();
      updatedCoinsId[coinData.id] = true;
    }
  });

  // Add new coins data
  Object.keys(data).map(coinId => {
    if (!updatedCoinsId[coinId]) {
      const newCoinData = new CoinData({
        user,
        id: coinId,
        data: data[coinId],
      });
      newCoinData.save();
    }
  });

  res.json({
    success: true,
  });
}

