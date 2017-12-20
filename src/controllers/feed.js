import BotConfig from '../models/botsConfig';

export async function updateFeedBotConfig(req, res) {
  const { config } = req.body;

  // Only have reddit/twitter coins
  config.list = config.list.filter(coinData =>
    (coinData.feed && coinData.feed.twitter && coinData.feed.twitter[0]) ||
    (coinData.feed && coinData.feed.reddit && coinData.feed.reddit[0]),
  );

  const botConfig = await BotConfig.findOne({
    user: 'global',
    bot: 'feed',
  });

  if (botConfig) {
    // Update
    botConfig.set({
      config,
    });
    botConfig.save();
  } else {
    // Create
    const newConfig = new BotConfig({
      user: 'global',
      bot: 'feed',
      config,
    });

    newConfig.save();
  }

  res.json({
    succes: true,
  });
}
