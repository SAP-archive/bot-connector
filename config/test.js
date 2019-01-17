module.exports = {
  db: {
    host: 'localhost',
    port: 27017,
    dbName: 'gromit-test',
  },
  server: {
    port: 2424,
  },
  redis: {
    port: 6379,
    host: 'localhost',
    auth: '',
    db: 14,
    options: {}, // see https://github.com/mranney/node_redis#rediscreateclient
  },
  base_url: 'http://localhost:2424',
  skillsBuilderUrl: 'https://api.cai.tools.sap/build/v1/dialog',
  facebook_app_id: '1234567890123456',
  facebook_app_secret: 'abcewfnjrefu340bg3',
  facebook_app_webhook_token: '',
}
