var makeTest = require('./context')
var Bottleneck = require('./bottleneck')
var assert = require('assert')

if (process.env.DATASTORE === 'valkey-glide') {
  var Glide = require('@valkey/valkey-glide')
  var addresses = [{
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379)
  }]

  describe('valkey-glide-only', function () {
    var c

    afterEach(function () {
      return c.limiter.disconnect(false)
    })

    it('Should accept valkey-glide lib override', async function () {
      // ARRANGE
      c = makeTest({ maxConcurrent: 2, Glide })

      // ACT
      await c.limiter.ready()

      // ASSERT
      c.mustEqual(c.limiter.datastore, 'valkey-glide')
    })

    it('Should close the client it opened when the other one fails to connect', async function () {
      // ARRANGE
      var openedClients = []
      var GlideWithFailingSubscriber = Object.assign({}, Glide, {
        GlideClient: {
          createClient: async function (configuration) {
            if (configuration.pubsubSubscriptions != null) throw new Error('subscriber connection failed')
            var client = await Glide.GlideClient.createClient(configuration)
            openedClients.push(client)
            return client
          }
        }
      })
      c = makeTest({ Glide: GlideWithFailingSubscriber, errorEventsExpected: true })

      // ACT
      var error = await c.limiter.ready().then(function () { return null }, function (err) { return err })
      await c.wait(100)

      // ASSERT
      c.mustEqual(error.message, 'subscriber connection failed')
      c.mustEqual(openedClients.length, 1)
      var requestError = await openedClients[0].get('key').then(function () { return null }, function (err) { return err })
      assert(requestError instanceof Glide.ClosingError)
    })

    it('Should accept existing connections', async function () {
      // ARRANGE
      var connection = new Bottleneck.GlideConnection({ clientOptions: { addresses } })
      connection.id = 'super-connection'
      c = makeTest({ minTime: 50, connection })

      // ACT
      c.pNoErrVal(c.limiter.schedule(c.promise, null, 1), 1)
      c.pNoErrVal(c.limiter.schedule(c.promise, null, 2), 2)
      await c.last()
      await c.limiter.disconnect()

      // ASSERT
      c.checkResultsOrder([[1], [2]])
      c.checkDuration(50)
      c.mustEqual(c.limiter.connection.id, 'super-connection')
      c.mustEqual(c.limiter.datastore, 'valkey-glide')
      c.mustEqual(await c.limiter.clients().client.customCommand(['PING']), 'PONG')
      await connection.disconnect()
    })

    it('Should accept an existing GlideClient and create the RESP3 subscriber from clientOptions', async function () {
      // ARRANGE
      var client = await Glide.GlideClient.createClient({ addresses, protocol: Glide.ProtocolVersion.RESP2 })
      var connection = new Bottleneck.GlideConnection({ client, clientOptions: { addresses } })
      c = makeTest({ connection })
      var messages = []
      c.limiter.on('message', function (message) { messages.push(message) })

      // ACT
      var result = await c.limiter.schedule(function () { return Promise.resolve('ran') })
      await c.limiter.publish('hello')
      await c.wait(100)

      // ASSERT
      c.mustEqual(result, 'ran')
      c.mustEqual(c.limiter.clients().client, client)
      c.mustEqual(messages, ['hello'])
      await c.limiter.disconnect()
      await connection.disconnect()
    })

    it('Should trigger an error event when the connection cannot be created', function (done) {
      // ARRANGE
      var connection = new Bottleneck.GlideConnection({
        clientOptions: {
          addresses: [{ host: '127.0.0.1', port: 1 }],
          advancedConfiguration: { connectionTimeout: 500 }
        }
      })

      // ACT
      connection.on('error', function (err) {
        // ASSERT
        assert(err != null)
        connection.disconnect().then(function () { done() }, done)
      })
      c = makeTest({ connection })
    })
  })
}
