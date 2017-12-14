import Twitter from 'twitter';

export class TwitterParser {
  constructor(config) {
    this.twitterClient = new Twitter(config);
  }

  parseHomeFeed() {
    return new Promise(resolve => {
      this.twitterClient.get(
        'statuses/home_timeline',
        { count: 200, exclude_replies: true, include_entities: false },
        (err, data) => {
          resolve(data);
        });
    });
  }
}

export default TwitterParser;
