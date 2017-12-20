import axios from 'axios';
import CryproScanCore from '../../controllers/parser';
import BotConfig from '../../models/botsConfig';
import CoinFeed from '../../models/coinFeed';
import { calcPercentage } from '../../utils/percentage';
import { formatDate } from '../../utils/date';

class FeedBot {
  async start() {
    const botConfig = await BotConfig.findOne({
      bot: 'feed',
      user: 'global',
    });

    this.config = botConfig.config;
    this.cryptoScan = new CryproScanCore(this.config);

    this.startParse();
    setInterval(this.startParse, this.config.updatePriceInterval);
  }

  async startParse() {
    console.log('Get coinmarket data');
    const tokensPrice = await this.cryptoScan.getTokensPrice();
    const coinFeed = await CoinFeed.find();
    const changedCoins = [];

    // Get changes coins
    await tokensPrice.map(async tokenPrice => {
      // Get coin data
      const coinData = coinFeed
        .filter(item => (item || {}).coinId === tokenPrice.id)[0];
      const prevCoinmarket = (coinData || {}).coinmarket;

      // Calc percent from last check
      const percentUsdFromPrevCheck = prevCoinmarket
        ? calcPercentage(tokenPrice.price_usd, prevCoinmarket.price_usd)
        : 0;
      const percentBtcFromPrevCheck = prevCoinmarket
        ? calcPercentage(tokenPrice.price_btc, prevCoinmarket.price_btc)
        : 0;

      // Save changed coins
      if (
        +percentUsdFromPrevCheck <= this.config.savedMaxPercentUsdSaved &&
        +percentUsdFromPrevCheck >= this.config.savedMinPercentUsdSaved &&
        +percentBtcFromPrevCheck >= 1
      ) {
        console.log('Price changed for ' + tokenPrice.id);
        changedCoins.push({
          id: tokenPrice.id,
          data: coinData,
        });

        if (coinData) {
          // Update
          coinData.coinmarket = {
            ...tokenPrice,
            percentBtcFromPrevCheck,
            percentUsdFromPrevCheck,
          };
          await coinData.save();
        } else {
          // Create
          const newCoinData = new CoinFeed({
            coinId: tokenPrice.id,
            coinmarket: {
              ...tokenPrice,
              percentBtcFromPrevCheck,
              percentUsdFromPrevCheck,
            },
          });

          await newCoinData.save();
        }
      }

      return tokenPrice;
    });


    // Clear timers
    if (this.timers) {
      this.timers.map(timer => {
        clearTimeout(timer);
      });
    } else {
      this.timers = [];
    }

    // Start auto parse feed for changedCoins
    changedCoins.map((coinData, index) => {
      this.timers.push(setTimeout(() => {
        this.updateTokenFeed(coinData.id, coinData.data);
      }, (20000 * Math.floor((index + 1) / 2)) + 5000));
    });
  }

  async updateTokenFeed(id, coinFeed) {
    // Parse feed for token and update in data
    const feed = await this.cryptoScan.getTokenFeed(id);
    console.log(`Update feed for: ${id}`);

    const coinPrevFeed = coinFeed && coinFeed.feed
      ? coinFeed.feed
      : null;

    // Check equal feed
    if (coinPrevFeed &&
      ((coinPrevFeed.twitter && coinPrevFeed.twitter[0]) || (coinPrevFeed.reddit && coinPrevFeed.reddit[0])) &&
      ((coinPrevFeed.twitter && coinPrevFeed.twitter[0]) || (coinPrevFeed.reddit && coinPrevFeed.reddit[0]))
    ) {
      // Check feed with prev result
      const twitterFeedEqual = this._checkFeedEqual(feed.twitter, coinPrevFeed.twitter);
      const redditFeedEqual = this._checkFeedEqual(feed.reddit, coinPrevFeed.reddit);

      if (!twitterFeedEqual.isEqual || !redditFeedEqual.isEqual) {
        // Push to discord ...
        console.log(`${id}: feed changed`);

        // Print new feed
        twitterFeedEqual.newFeed.map(this._notifyFeedItem);
        redditFeedEqual.newFeed.map(this._notifyFeedItem);
      }
    }

    // Save feed as prev feed
    const coinData = await CoinFeed.findOne({ coinId: id });
    coinData.feed = feed;
    coinData.save();
  }

  _checkFeedEqual(feed, prevFeed) {
    // Check feed equal

    if (!feed) feed = [];
    if (!prevFeed) prevFeed = [];

    let isEqual = true;
    const newFeed = [];

    feed.map(feedItem => {
      const itemIsEqual = prevFeed
        .filter(prevFeedItem => (prevFeedItem || {}).title === (feedItem || {}).title)[0];

      if (!itemIsEqual) {
        isEqual = false;
        newFeed.push(feedItem);
      }
    });


    return {
      isEqual,
      newFeed,
    };
  }

  _notifyFeedItem(item) {
    // Print new feed
    console.log('New items');
    axios.post(this.config.discordWebhook, {
      content: `${item.title}\n${formatDate(item.formatDate)} / ${item.author}\n${item.url}`,
    }, {
      headers: { 'content-type': 'application/json' },
    });

    console.log({
      title: item.title,
      date: item.date,
      url: item.url,
    });
  }
}

export default FeedBot;
