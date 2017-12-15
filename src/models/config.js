import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const configSchema = new Schema({
  user: String,
  data: String,
  config: String,
});

const Config = mongoose.model('Config', configSchema);

export default Config;
