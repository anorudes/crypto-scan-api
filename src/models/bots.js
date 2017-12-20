import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const botsSchema = new Schema({
  bot: String,
  config: String,
  user: String,
});

const BotConfig = mongoose.model('BotConfig', botsSchema);

export default BotConfig;
