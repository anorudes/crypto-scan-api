import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const botsSchema = new Schema({
  bot: String,
  config: Object,
  user: String,
});

const BotConfig = mongoose.model('BotConfig', botsSchema);

export default BotConfig;
