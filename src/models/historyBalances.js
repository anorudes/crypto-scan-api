import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const historyBalancesSchema = new Schema({
  user: String,
  data: Array,
});

const HistoryBalances = mongoose.model('HistoryBalances', historyBalancesSchema);

export default HistoryBalances;
