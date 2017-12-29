// @flow
import rssParser from 'rss-parser';
import Twitter from 'twitter';
import removeHtmlTags from './utils/removeHtmlTags';

class CryptoScanParser {
  config: Object;

  constructor(config: Object) {
    this.config = config;

    this.twitterClient = new Twitter(config.twitter);
  }

  async parseTwitterFeed(
    slug: string,
  ): Promise<any> {
    // Parse twitter feed
    return new Promise((resolve: Function) => {
      const tweets = [];
      this.twitterClient.get(
        'statuses/user_timeline',
        { screen_name: slug, count: 200, exclude_replies: true, include_entities: false },
        (err, data) => {
          data && data.map(tweet => {
            tweets.push({
              title: removeHtmlTags(tweet.text),
              url: `https://twitter.com/statuses/${tweet.id_str}`,
              date: new Date(tweet.created_at),
            });
          });

          resolve(tweets);
        });
    });
  }

  async parseRSSFeed(
    list: Array<Object>,
    rssUrl: string,
  ): Promise<any> {
    // Parse all feed url

    if (!list || !list[0]) return [];
    const result = [];

    return new Promise((resolve: Function) => {
      list.map((item: Object) => {
        const url: string = rssUrl.replace('%SLUG%', item.slug);
        const filterBy: Object = item.filterBy;

        rssParser.parseURL(url, (err, parsed) => {
          if (parsed && parsed.feed && parsed.feed.entries) {
            parsed.feed.entries.map(entry => {
              // Filter entry

              if (this._filterEntry(entry, filterBy)) {
                result.push({
                  title: entry.title,
                  url: entry.link,
                  date: entry.pubDate,
                  text: removeHtmlTags(entry.content),
                  author: entry.author,
                });
              }
            });
          }

          resolve(result);
        })
      });
    });
  }

  _filterEntry(entry: Object, filterBy: Object = {}) {
    // Filter rss entries by users name, regexes and keywords
    const {
      users,
      regexes,
      keywords,
    }: {
      users: Array<string>,
      regexes: Array<string>,
      keywords: Array<string>
    } = filterBy;

    let filtered = true;

    // Filter by user name
    if (users && !users.includes(entry.author)) {
      filtered = false;
    }

    return filtered;
  }
}

export default CryptoScanParser;
