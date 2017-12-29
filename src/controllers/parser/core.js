// @flow
import axios from 'axios';
import CryptoScanParser from './parser';
import {
  REDDIT_RSS_URL,
  COINMARKET_TICKER_ENDPOINT,
  COINMARKET_GRAPH_ENDPOINT,
  TWITTER_RSS_URL
} from './constants';

class CryptoScanCore extends CryptoScanParser {
  config: Object;
  tokens: Object;
  feedByToken: Object;
  priceByToken: Object;

  constructor(config: Object) {
    super(config);
    this.config = config;
    this.feedByToken = {};
    this.priceByToken = {};
  }

  async getTokenFeed(coinmarketId: string) {
    const tokenData = this._getTokenData(coinmarketId);

    if (tokenData && tokenData.feed) {
      const feed: Object = tokenData.feed || {};
      const redditFeed = await this.parseRSSFeed(feed.reddit, REDDIT_RSS_URL)
      const twitterFeed = feed.twitter && feed.twitter[0]
        ? await this.parseTwitterFeed(feed.twitter[0].slug)
        : null;

      return {
        twitter: this._sortFeedByDate(twitterFeed),
        reddit: this._sortFeedByDate(redditFeed),
      };
    }
  }

  async getTokensPrice() {
    const coinmarketData: Object = await axios.get(COINMARKET_TICKER_ENDPOINT, {
      params: {
        limit: 0,
      }
    });

    return coinmarketData.data;
  }

  async getTokenPrice(coinmarketId: string) {
    const coinmarketData: Object = await axios.get(`${COINMARKET_TICKER_ENDPOINT}/${coinmarketId}`, {
      params: {
        limit: 0,
      }
    });

    if (coinmarketData.data && coinmarketData.data[0]) {
      return coinmarketData.data[0];
    }
  }

  async getTokenGraph(coinmarketId: string, startTimestamp: number, endTimestamp: number) {
    const endpoint:string = `${COINMARKET_GRAPH_ENDPOINT}/${coinmarketId}/${startTimestamp}000/${endTimestamp}000/`;
    const coinmarketData: Promise<any> = await axios.get(endpoint);
    return coinmarketData.data;
  }

  _sortFeedByDate(feed) {
    return feed
      .sort((a, b) => new Date(a.date) < new Date(b.date)
        ? 1
        : -1
      );
  }

  _getTokenData(coinmarketId: string) {
    const list: Array<Object> = this.config.list;
    const tokenData:Object = list
          .filter(item => item.coinmarketId === coinmarketId)[0]

    return tokenData;
  }
}

export default CryptoScanCore;
