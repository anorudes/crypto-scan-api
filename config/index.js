
export default {
  db: {
    url: process.NODE_MONGO_URL || 'mongodb://bot:VqZs16aBmIX3AMy8@104.236.5.255/bot',
  },
  server: {
    host: process.NODE_HOST || 'localhost',
    port: process.NODE_PORT || 3080,
  },
};
