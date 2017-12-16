export class Core {
  constructor({ twitterClient }) {
    this.twitterClient = twitterClient;
  }

  init() {
    // setInterval(() => {
    //   this.twitterParser.parseHomeFeed(data => {
    //     // check with last result
    //     // save to db new data
    //     const tweets = [];
    //     data.map(tweet => {
    //       const date = new Date(tweet.created_at);
//
    //       tweets.push({
              //         date,
            //         text: tweet.text,
    //       });
    //     });
//
    //     global.tweets = tweets;
    //   });
    // }, 1000 * 60 * 20);
  }
}

export default Core;
