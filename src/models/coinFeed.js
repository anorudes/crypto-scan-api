import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const coinFeedSchema = new Schema({
  coinId: String,
  feed: Object,
  coinmarket: Object,
});

const CoinFeed = mongoose.model('CoinFeed', coinFeedSchema);

export default CoinFeed;
