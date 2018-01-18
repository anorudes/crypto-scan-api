import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exchangeFeedSchema = new Schema({
  slug: String,
  feed: Object,
});

const ExchangeFeed = mongoose.model('ExchangeFeed', exchangeFeedSchema);

export default ExchangeFeed;
