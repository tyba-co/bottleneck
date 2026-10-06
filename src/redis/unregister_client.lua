if redis.call('exists', settings_key) == 1 then
  -- A disconnected client can never free its jobs, so expire them now; it no longer queues, so it cannot be offered capacity
  redis.call('hset', client_num_queued_key, client, 0)
  local job_clients = redis.call('hgetall', job_clients_key)
  for i = 1, #job_clients, 2 do
    if job_clients[i + 1] == client then
      redis.call('zadd', job_expirations_key, 0, job_clients[i])
    end
  end
  process_tick(now, false)
end

redis.call('zrem', client_running_key, client)
redis.call('hdel', client_num_queued_key, client)
redis.call('zrem', client_last_registered_key, client)
redis.call('zrem', client_last_seen_key, client)

return {}
