import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const configSchema = new Schema({
  config: String,
});

const Config = mongoose.model('Config', configSchema);

export default Config;
