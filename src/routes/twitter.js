import Express from 'express';
import Twitter from 'twitter';
import wrap from 'express-async-wrap';
const Router = new Express.Router();

const twitterClient = new Twitter({
  consumer_key: 'CA1M166WKQ7gkiVYrhqByKLTP',
  consumer_secret: 'XFAf6NHsyMBRT0HhVGgDB90iJIEnmd5DUUvVCf75wlBtCMOCZ6',
  access_token_key: '850801796-T3Dig8y15kRr3DrRQP1qgRwjhcr1NpWabtuVyxhX',
  access_token_secret: 'kNgrGpIIOhW3NTy1lTj1Z7vEJlLtqGYyKq2n5hl4GJNI8'
});

export default [
  Router.get('/api/twitter', wrap(async function (req, res) {
    twitterClient.get('statuses/home_timeline', { count: 200, exclude_replies: true, include_entities: true }, (err, data, response) => {
      res.json(data);
    });
  })),
];
