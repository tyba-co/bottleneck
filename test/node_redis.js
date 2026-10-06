var makeTest = require('./context')
var Bottleneck = require('./bottleneck')
var assert = require('assert')
var Redis = require('redis')

if (process.env.DATASTORE === 'redis') {
  describe('node_redis-only', function () {
    var c

    afterEach(function () {
      return c.limiter.disconnect(false)
    })

    it('Should accept node_redis lib override', async function () {
      c = makeTest({
        maxConcurrent: 2,
        Redis
      })

      c.mustEqual(c.limiter.datastore, 'redis')
      await c.limiter.ready()
    })

    it('Should reject the removed ioredis datastore', function () {
      c = makeTest()

      assert.throws(function () {
        new Bottleneck({ datastore: 'ioredis' })
      }, /The "ioredis" datastore was removed in 3\.0\.0/)
    })

    it('Should accept existing connections', function () {
      var connection = new Bottleneck.RedisConnection()
      connection.id = 'super-connection'
      c = makeTest({
        minTime: 50,
        connection
      })

      c.pNoErrVal(c.limiter.schedule(c.promise, null, 1), 1)
      c.pNoErrVal(c.limiter.schedule(c.promise, null, 2), 2)

      return c.last()
        .then(function (results) {
          c.checkResultsOrder([[1], [2]])
          c.checkDuration(50)
          c.mustEqual(c.limiter.connection.id, 'super-connection')
          c.mustEqual(c.limiter.datastore, 'redis')

          return c.limiter.disconnect()
        })
        .then(function () {
        // Shared connections should not be disconnected by the limiter
          c.mustEqual(c.limiter.clients().client.isReady, true)
          return connection.disconnect()
        })
    })

    it('Should accept existing redis clients', function () {
      var client = Redis.createClient()
      client.id = 'super-client'

      var connection = new Bottleneck.RedisConnection({ client })
      connection.id = 'super-connection'
      c = makeTest({
        minTime: 50,
        connection
      })

      c.pNoErrVal(c.limiter.schedule(c.promise, null, 1), 1)
      c.pNoErrVal(c.limiter.schedule(c.promise, null, 2), 2)

      return c.last()
        .then(function (results) {
          c.checkResultsOrder([[1], [2]])
          c.checkDuration(50)
          c.mustEqual(c.limiter.clients().client.id, 'super-client')
          c.mustEqual(c.limiter.connection.id, 'super-connection')
          c.mustEqual(c.limiter.datastore, 'redis')

          return c.limiter.disconnect()
        })
        .then(function () {
        // Shared connections should not be disconnected by the limiter
          c.mustEqual(c.limiter.clients().client.isReady, true)
          return connection.disconnect()
        })
    })

    it('Should accept an already connected redis client', async function () {
      var client = Redis.createClient()
      await client.connect()
      var connection = new Bottleneck.RedisConnection({ client })
      c = makeTest({ connection })

      var result = await c.limiter.schedule(function () { return Promise.resolve('ran') })

      c.mustEqual(result, 'ran')
      await c.limiter.disconnect()
      await connection.disconnect()
    })

    it('Should trigger error events on the shared connection', function (done) {
      var connection = new Bottleneck.RedisConnection({
        clientOptions: {
          socket: { port: 1 }
        }
      })
      var finished = false
      connection.on('error', function (err) {
        if (finished) return
        finished = true
        c.mustEqual(c.limiter.datastore, 'redis')
        connection.disconnect().then(function () { done() }, done)
      })

      c = makeTest({ connection })
      c.limiter.on('error', function (err) {
        done(err)
      })
    })
  })
}
