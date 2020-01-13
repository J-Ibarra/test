const path = require('path')
const redis = require(path.join(__dirname, '../packages/libs/util/db-connector', 'dist', 'cache', 'redis'))

after((done) => {
  Promise.all([
    redis.closeCacheClient(),
    redis.closeSubClient(),
    redis.closeVanillaRedisClient()
  ]).then(() => {
    done()
  })
})