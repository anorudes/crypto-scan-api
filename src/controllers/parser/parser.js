import rssParser from 'rss-parser';
import Twitter from 'twitter';
import removeHtmlTags from './utils/removeHtmlTags';

class CryptoScanParser {
  constructor(config) {
    this.config = config;

    this.twitterClient = new Twitter(config.twitter);
  }

  async parseTwitterFeed(slug) {
    // Parse twitter feed
    return new Promise((resolve) => {
      const tweets = [];
      this.twitterClient.get(
        'statuses/user_timeline',
        { screen_name: slug, count: 200, exclude_replies: true, include_entities: false },
        (err, data) => {
          data && data.map && data.map(tweet => {
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

  async parseRSSFeed(list, rssUrl) {
    // Parse all feed url

    if (!list || !list[0]) return [];
    const result = [];

    return new Promise((resolve) => {
      list.map((item) => {
        const url = rssUrl.replace('%SLUG%', item.slug);
        const filterBy = item.filterBy;

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
        });
      });
    });
  }

  _filterEntry(entry, filterBy) {
    // Filter rss entries by users name, regexes and keywords
    const { users } = filterBy;

    let filtered = true;

    // Filter by user name
    if (users && !users.includes(entry.author)) {
      filtered = false;
    }

    return filtered;
  }
}

export default CryptoScanParser;
