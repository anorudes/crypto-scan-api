import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const historyDataSchema = new Schema({
  exchange: String,
  market: String,
  tickInterval: String,
  data: Array,
});


// Promise
historyDataSchema.statics.findOrCreate = function findOrCreate(condition) {
  const self = this;

  return new Promise(async (resolve, reject) => {
    let result = await self.findOne(condition);
    if (result) {
      resolve(result);
    } else {
      result = await self.create(condition);
      if (!result) {
        reject();
      }
    }
    return result;
  });
};

const HistoryData = mongoose.model('HistoryData', historyDataSchema);

export default HistoryData;
