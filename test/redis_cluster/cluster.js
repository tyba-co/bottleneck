var Bottleneck = require('../bottleneck')
var assert = require('assert')
var Redis = require('redis')

var clusterNodes = (process.env.REDIS_CLUSTER_NODES || '127.0.0.1:30001,127.0.0.1:30002,127.0.0.1:30003')
  .split(',')
  .map(function (node) {
    return { url: `redis://${node}` }
  })

var clusterOptions = function (options) {
  return Object.assign({
    datastore: process.env.DATASTORE,
    clientOptions: {},
    clusterNodes: clusterNodes
  }, options)
}

var uniqueId = function (name) {
  return `{${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}}:`
}

var wait = function (ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}

var runCommand = function (limiter, command) {
  return limiter._store.connection.__runCommand__(command)
}

describe('Redis Cluster', function () {
  var limiters

  var makeLimiter = function (options) {
    var limiter = new Bottleneck(clusterOptions(options))
    limiter.on('error', function (err) {
      console.log('(CLUSTER) ERROR EVENT', err)
    })
    limiters.push(limiter)
    return limiter
  }

  beforeEach(function () {
    limiters = []
  })

  afterEach(function () {
    return Promise.all(limiters.map(function (limiter) { return limiter.disconnect(false) }))
  })

  it('Should connect and run jobs with a hash-tagged id', async function () {
    // ARRANGE
    var limiter = makeLimiter({ id: uniqueId('connect'), maxConcurrent: 2, clearDatastore: true })
    await limiter.ready()

    // ACT
    var results = await Promise.all([1, 2, 3].map(function (x) {
      return limiter.schedule(function () { return Promise.resolve(x * 2) })
    }))

    // ASSERT
    assert.deepStrictEqual(results, [2, 4, 6])
  })

  it('Should share maxConcurrent across limiter instances with the same id', async function () {
    // ARRANGE
    var id = uniqueId('concurrency')
    var limiter1 = makeLimiter({ id: id, maxConcurrent: 1, clearDatastore: true })
    await limiter1.ready()
    var limiter2 = makeLimiter({ id: id, maxConcurrent: 1 })
    await limiter2.ready()
    var running = 0
    var maxRunning = 0
    var job = async function () {
      running++
      maxRunning = Math.max(maxRunning, running)
      await wait(50)
      running--
    }

    // ACT
    await Promise.all([
      limiter1.schedule(job),
      limiter2.schedule(job),
      limiter1.schedule(job),
      limiter2.schedule(job)
    ])

    // ASSERT
    assert.strictEqual(maxRunning, 1)
  })

  it('Should space jobs by minTime across limiter instances with the same id', async function () {
    // ARRANGE
    var id = uniqueId('mintime')
    var limiter1 = makeLimiter({ id: id, minTime: 100, clearDatastore: true })
    await limiter1.ready()
    var limiter2 = makeLimiter({ id: id, minTime: 100 })
    await limiter2.ready()
    var startTimes = []
    var job = function () {
      startTimes.push(Date.now())
      return Promise.resolve()
    }

    // ACT
    await Promise.all([
      limiter1.schedule(job),
      limiter2.schedule(job),
      limiter1.schedule(job),
      limiter2.schedule(job)
    ])

    // ASSERT
    startTimes.sort(function (a, b) { return a - b })
    for (var i = 1; i < startTimes.length; i++) {
      assert(startTimes[i] - startTimes[i - 1] >= 90, `jobs ${i - 1} and ${i} started ${startTimes[i] - startTimes[i - 1]}ms apart`)
    }
  })

  it('Should apply settings updated by another instance that does not clear the datastore', async function () {
    // ARRANGE
    var id = uniqueId('settings')
    var limiter1 = makeLimiter({ id: id, maxConcurrent: 1, minTime: 0, clearDatastore: true })
    await limiter1.ready()
    var limiter2 = makeLimiter({ id: id, clearDatastore: false })

    // ACT
    await limiter2.updateSettings({ maxConcurrent: 3, minTime: 25 })
    await limiter2.ready()

    // ASSERT
    var maxConcurrent = await runCommand(limiter1, ['hget', `b_${id}_settings`, 'maxConcurrent'])
    var minTime = await runCommand(limiter1, ['hget', `b_${id}_settings`, 'minTime'])
    assert.strictEqual(maxConcurrent, '3')
    assert.strictEqual(minTime, '25')
  })

  it('Should track the reservoir across instances', async function () {
    // ARRANGE
    var id = uniqueId('reservoir')
    var limiter1 = makeLimiter({ id: id, reservoir: 2, clearDatastore: true })
    await limiter1.ready()
    var limiter2 = makeLimiter({ id: id })
    await limiter2.ready()

    // ACT
    await limiter2.incrementReservoir(3)
    await limiter1.schedule(function () { return Promise.resolve() })
    var reservoir = await limiter2.currentReservoir()

    // ASSERT
    assert.strictEqual(reservoir, 4)
  })

  it('Should recover when the settings key is deleted', async function () {
    // ARRANGE
    var id = uniqueId('settings-deleted')
    var limiter = makeLimiter({ id: id, maxConcurrent: 2, clearDatastore: true })
    await limiter.ready()
    await runCommand(limiter, ['del', `b_${id}_settings`])

    // ACT
    var result = await limiter.schedule(function () { return Promise.resolve('recovered') })

    // ASSERT
    assert.strictEqual(result, 'recovered')
    var exists = await runCommand(limiter, ['exists', `b_${id}_settings`])
    assert.strictEqual(exists, 1)
  })

  it('Should recover when the client registration is lost', async function () {
    // ARRANGE
    var id = uniqueId('client-lost')
    var limiter = makeLimiter({ id: id, maxConcurrent: 2, clearDatastore: true })
    await limiter.ready()
    await runCommand(limiter, ['zrem', `b_${id}_client_last_seen`, limiter._store.clientId])

    // ACT
    var result = await limiter.schedule(function () { return Promise.resolve('recovered') })

    // ASSERT
    assert.strictEqual(result, 'recovered')
  })

  it('Should reject jobs heavier than maxConcurrent with a BottleneckError', async function () {
    // ARRANGE
    var limiter = makeLimiter({ id: uniqueId('overweight'), maxConcurrent: 2, clearDatastore: true })
    await limiter.ready()

    // ACT
    var error = await limiter.schedule({ weight: 3 }, function () { return Promise.resolve() })
      .then(function () { return null }, function (err) { return err })

    // ASSERT
    assert(error instanceof Bottleneck.BottleneckError)
    assert.strictEqual(error.message, 'Impossible to add a job having a weight of 3 to a limiter having a maxConcurrent setting of 2')
  })

  it('Should list and delete the keys of a Group with a hash-tagged id', async function () {
    // ARRANGE
    var group = new Bottleneck.Group(clusterOptions({ id: uniqueId('group'), maxConcurrent: 1, clearDatastore: true }))
    var limiterA = group.key('a')
    var limiterB = group.key('b')
    limiters.push(limiterA, limiterB)
    await Promise.all([limiterA.ready(), limiterB.ready()])

    // ACT
    var keysBeforeDelete = await group.clusterKeys()
    var deleted = await group.deleteKey('a')
    var keysAfterDelete = await group.clusterKeys()

    // ASSERT
    assert.deepStrictEqual(keysBeforeDelete.sort(), ['a', 'b'])
    assert.strictEqual(deleted, true)
    assert.deepStrictEqual(keysAfterDelete, ['b'])
    await group.disconnect(false)
  })

  it('Should run jobs through an injected cluster client', async function () {
    // ARRANGE
    var client = Redis.createCluster({ rootNodes: clusterNodes })
    var connection = new Bottleneck.RedisConnection({ client: client })
    var limiter = makeLimiter({ id: uniqueId('injected'), connection: connection, clearDatastore: true })

    // ACT
    var result = await limiter.schedule(function () { return Promise.resolve('ran') })

    // ASSERT
    assert.strictEqual(result, 'ran')
    await limiter.disconnect()
    await connection.disconnect()
  })

  it('Should store a 2.x schema version so deployed 2.x clients skip every migration', async function () {
    // ARRANGE
    var id = uniqueId('schema')
    var limiter = makeLimiter({ id: id, maxConcurrent: 2, clearDatastore: true })

    // ACT
    await limiter.ready()

    // ASSERT
    var version = await runCommand(limiter, ['hget', `b_${id}_settings`, 'version'])
    var [major, minor] = version.split('.').map(Number)
    assert.strictEqual(major, 2)
    assert(minor >= 19, `stored version ${version} would make 2.x clients re-run migrations`)
  })

  it('Should fail to start a limiter whose id has no hash tag', async function () {
    // ARRANGE
    var limiter = makeLimiter({ id: `no-hash-tag-${Date.now()}`, clearDatastore: true })

    // ACT
    var error = await limiter.ready().then(function () { return null }, function (err) { return err })

    // ASSERT
    assert(error != null, 'ready() should reject on a cluster when the keys span several slots')
    assert.match(error.message, /CROSSSLOT/)
  })
})
