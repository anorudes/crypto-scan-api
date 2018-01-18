import axios from 'axios';
import CryproScanCore from '../../controllers/parser';
import BotConfig from '../../models/botsConfig';
import CoinFeed from '../../models/coinFeed';
import ExchangeFeed from '../../models/exchangeFeed';
import { calcPercentage } from '../../utils/percentage';
import { formatDate } from '../../utils/date';
import { TWITTER_CONFIG } from '../../../config';

const EXCHANGES_LIST = [{
  slug: 'kucoincom',
  name: 'Kucoin',
}, {
  slug: 'poloniex',
  name: 'Poloniex',
}, {
  slug: 'bittrexexchange',
  name: 'Bittrex',
}, {
  slug: 'okex_',
  name: 'Okex',
}, {
  slug: 'hitbtc',
  name: 'Hitbtc',
}, {
  slug: 'bitfinex',
  name: 'Bitfinex',
}, {
  slug: 'bitstamp',
  name: 'Bitstamp',
}, {
  slug: 'gdax',
  name: 'Gdax',
}, {
  slug: 'krakenfx',
  name: 'Kraken',
}, {
  slug: 'poloniex',
  name: 'Poloniex',
}, {
  slug: 'cryptopia_nz',
  name: 'Cryptopia',
}];

class FeedBot {
  async start() {
    const botConfig = await BotConfig.findOne({
      bot: 'feed',
      user: 'global',
    });

    this.config = botConfig.config;
    this.cryptoScan = new CryproScanCore({
      ...this.config,
      twitter: TWITTER_CONFIG,
    });

    this.notifyInterval = setInterval(this.notifyFromQueue.bind(this), 1000);
    this.notifyList = [];

    setInterval(this.startParse.bind(this), 3600000);
    setInterval(this.getExchangeFeed.bind(this), 600000);

    this.startParse();
    this.getExchangeFeed();
  }

  async startParse() {
    console.log('Get coinmarket data');

    const tokensPrice = await this.cryptoScan.getTokensPrice();
    const coinFeed = await CoinFeed.find();
    const coinsFeedConfig = this.config.list;
    const changedCoins = [];

    // Get changes coins
    await tokensPrice.map(async tokenPrice => {
      // Only for our coins
      if (!coinsFeedConfig.filter(item => item.coinmarketId === tokenPrice.id).length) {
        return false;
      }

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

      const coinmarket = {
        ...tokenPrice,
        percentUsdFromPrevCheck,
        percentBtcFromPrevCheck,
      };

      // Save changed coins
      if (
        +percentUsdFromPrevCheck >= 2 &&
        +percentBtcFromPrevCheck >= 1.75
      ) {
        console.log('Price + for ' + tokenPrice.id);
        changedCoins.push({
          id: tokenPrice.id,
          feed: coinData.feed,
          coinmarket,
        });
      }

      if (coinData) {
        // Update
        coinData.coinmarket = coinmarket;
        await coinData.save();
      } else {
        // Create
        const newCoinData = new CoinFeed({
          coinId: tokenPrice.id,
          coinmarket,
        });

        await newCoinData.save();
      }
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
        this.updateTokenFeed(coinData.id, coinData.feed, coinData.coinmarket);
      }, 4000 * Math.floor((index + 1) / 2)));
    });
  }

  async getExchangeFeed() {
    EXCHANGES_LIST.map((data, index) => {
      const { slug, name } = data;

      setTimeout(async () => {
        console.log(`Update exchange feed: ${name}`);
        const feed = await this.cryptoScan.getTwitterFeed(slug);

        const exchange = await ExchangeFeed.findOne({ slug });
        const twitterFeedEqual = this.checkFeedEqual(feed, (exchange || {}).feed);

        if (!twitterFeedEqual.isEqual) {
          // Push to discord ...

          // Print new feed

          const now = Date.now();
          const completeNewFeed = twitterFeedEqual.newFeed.filter(item => item && (now - new Date(item.date).getTime() <= 24 * 3600 * 1000));

          if (completeNewFeed.length) {
            let message = `------------------------------------------------------------------------\n**▶  ${name}**\n------------------------------------------------------------------------\n`;

            completeNewFeed.map(item => {
              message += `<:twitter:393802607363358720>[${formatDate(item.date)}](<${item.url}>) ${item.title.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')}\n`;
            });

            this.addToNotifyQueue(message);

            if (exchange) {
              exchange.feed = feed;
              exchange.save();
            } else {
              const newExchangeFeed = new ExchangeFeed({
                slug,
                feed,
              });
              newExchangeFeed.save();
            }
          }
        }
      }, index * 5000);
    });
  }

  async updateTokenFeed(id, coinFeed, coinmarket) {
    // Parse feed for token and update in data
    const feed = await this.cryptoScan.getTokenFeed(id);
    console.log(`Update feed for: ${id}`);

    const coinPrevFeed = coinFeed
      ? coinFeed
      : null;

    // Check equal feed
    if (
      feed.twitter && feed.twitter[0] && coinPrevFeed && coinPrevFeed.twitter && coinPrevFeed.twitter[0]
    ) {
      console.log('check feed');
      // Check feed with prev result
      const twitterFeedEqual = this.checkFeedEqual(feed.twitter, (coinPrevFeed || {}).twitter);
      // const redditFeedEqual = this.checkFeedEqual(feed.reddit, (coinPrevFeed || {}).reddit);

      if (!twitterFeedEqual.isEqual) {
        // Push to discord ...

        // Print new feed

        const now = Date.now();
        const completeNewFeed = [
          ...twitterFeedEqual.newFeed,
        ].filter(item => item && (now - new Date(item.date).getTime() <= 12 * 3600 * 1000));

        if (completeNewFeed.length) {
          let message = `------------------------------------------------------------------------\n**${coinmarket.symbol}, ${id}** — btc ${coinmarket.percentBtcFromPrevCheck}% | usd ${coinmarket.percentUsdFromPrevCheck}%\n------------------------------------------------------------------------\n`;

          completeNewFeed.map(item => {
            message += `${item.url.indexOf('twitter') !== -1 ? '<:twitter:393802607363358720> ' : '<:reddit:393802829849952260> '}[${formatDate(item.date)}](<${item.url}>) ${item.title.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')}\n`;
          });

          this.addToNotifyQueue(message);
        }

      } else {
        console.log(`${id}: feed not changed`);
      }
    } else {
      console.log('Skip because not have new or prev feed');
    }

    // Save feed as prev feed
    const coinData = await CoinFeed.findOne({ coinId: id });
    coinData.feed = feed;
    coinData.save();
  }

  checkFeedEqual(feed, prevFeed) {
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

  addToNotifyQueue(content) {
    this.notifyList.push(content);
  }

  notifyFromQueue() {
    if (this.notifyList && this.notifyList[0]) {
      const content = this.notifyList[0];
      axios.post('https://discordapp.com/api/webhooks/396622238662524929/s1Et4W_UBCudB6-38rkM39xdS_8NivxKKDGYJOfeM3yREAKukFcBT12iO_8v4BD5PJ_V', {
        content,
      }, {
        headers: { 'content-type': 'application/json' },
      });

      this.notifyList = this.notifyList.slice(1);
    }
  }
}

export default FeedBot;
