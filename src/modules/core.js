export class Core {
  constructor({ twitterClient }) {
    this.twitterClient = twitterClient;
  }

  init() {
    setInterval(() => {
      this.twitterParser.parseHomeFeed(feed => {
        // check with last result
        // save to db new data
      });
    }, 1000 * 60 * 20);
  }
}

export default Core;
