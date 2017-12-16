import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const coinDataSchema = new Schema({
  user: String,
  id: String,
  data: Object,
});

const CoinData = mongoose.model('ConfigData', coinDataSchema);

export default CoinData;
