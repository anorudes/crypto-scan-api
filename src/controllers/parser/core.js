import axios from 'axios';
import CryptoScanParser from './parser';
import {
  REDDIT_RSS_URL,
  COINMARKET_TICKER_ENDPOINT,
  COINMARKET_GRAPH_ENDPOINT,
  TWITTER_RSS_URL
} from './constants';

class CryptoScanCore extends CryptoScanParser {
  constructor(config) {
    super(config);
    this.config = config;
    this.feedByToken = {};
    this.priceByToken = {};
  }

  async getTokenFeed(coinmarketId) {
    const tokenData = this._getTokenData(coinmarketId);

    if (tokenData && tokenData.feed) {
      const feed = tokenData.feed || {};
      const redditFeed = await this.parseRSSFeed(feed.reddit, REDDIT_RSS_URL)
      const twitterFeed = feed.twitter && feed.twitter[0]
        ? await this.parseTwitterFeed(feed.twitter[0].slug)
        : null;

      return {
        twitter: this._sortFeedByDateAndLimit(twitterFeed),
        reddit: this._sortFeedByDateAndLimit(redditFeed),
      };
    }
  }

  async getTwitterFeed(slug) {
    const feed = await this.parseTwitterFeed(slug);

    return this._sortFeedByDateAndLimit(feed);
  }

  async getTokensPrice() {
    const coinmarketData = await axios.get(COINMARKET_TICKER_ENDPOINT, {
      params: {
        limit: 0,
      },
    });

    return coinmarketData.data;
  }

  async getTokenPrice(coinmarketId) {
    const coinmarketData = await axios.get(`${COINMARKET_TICKER_ENDPOINT}/${coinmarketId}`, {
      params: {
        limit: 0,
      },
    });

    if (coinmarketData.data && coinmarketData.data[0]) {
      return coinmarketData.data[0];
    }
  }

  async getTokenGraph(coinmarketId, startTimestamp, endTimestamp) {
    const endpoint = `${COINMARKET_GRAPH_ENDPOINT}/${coinmarketId}/${startTimestamp}000/${endTimestamp}000/`;
    const coinmarketData = await axios.get(endpoint);
    return coinmarketData.data;
  }

  _sortFeedByDateAndLimit(feed) {
    return feed
      .sort((a, b) => new Date(a.date) < new Date(b.date)
        ? 1
        : -1
      ).slice(0, 20);
  }

  _getTokenData(coinmarketId) {
    const list = this.config.list;
    const tokenData = list
          .filter(item => item.coinmarketId === coinmarketId)[0];

    return tokenData;
  }
}

export default CryptoScanCore;
