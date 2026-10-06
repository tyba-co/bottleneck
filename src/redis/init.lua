local clear = tonumber(ARGV[num_static_argv + 1])
local limiter_version = ARGV[num_static_argv + 2]
local num_local_argv = num_static_argv + 2

local new_settings = {}
for i = num_local_argv + 1, #ARGV, 2 do
  new_settings[ARGV[i]] = ARGV[i + 1]
end

local get_responsive_clients = function (seen_since)
  local responsive = {}
  for _, responsive_client in ipairs(redis.call('zrangebyscore', client_last_seen_key, seen_since, '+inf')) do
    responsive[responsive_client] = true
  end
  return responsive
end

local keep_only_running_jobs_of = function (responsive)
  local clients_running_jobs = {}
  local job_clients = redis.call('hgetall', job_clients_key)
  for i = 1, #job_clients, 2 do
    local index = job_clients[i]
    local job_client = job_clients[i + 1]
    if responsive[job_client] then
      clients_running_jobs[job_client] = true
    else
      redis.call('hdel', job_weights_key, index)
      redis.call('hdel', job_clients_key, index)
      redis.call('zrem', job_expirations_key, index)
    end
  end

  -- Clients without running jobs register again, with their current queue, on their next call
  for _, registered_client in ipairs(redis.call('zrange', client_last_seen_key, 0, -1)) do
    if not clients_running_jobs[registered_client] then
      redis.call('zrem', client_running_key, registered_client)
      redis.call('hdel', client_num_queued_key, registered_client)
      redis.call('zrem', client_last_registered_key, registered_client)
      redis.call('zrem', client_last_seen_key, registered_client)
    end
  end
end

local get_running_weight = function ()
  local running = 0
  for _, weight in ipairs(redis.call('hvals', job_weights_key)) do
    running = running + tonumber(weight)
  end
  return running
end

local kept_next_request = nil

if clear == 1 then
  -- Responsive clients keep their running jobs and the spacing of the last job, so a clear never lets them exceed the limits
  local responsive = get_responsive_clients(now - tonumber(new_settings['clientTimeout']))
  if next(responsive) ~= nil then
    kept_next_request = tonumber(redis.call('hget', settings_key, 'nextRequest'))
  end
  redis.call('del', settings_key)
  keep_only_running_jobs_of(responsive)
end

if redis.call('exists', settings_key) == 0 then
  -- Create
  local args = {'hmset', settings_key}

  for i = num_local_argv + 1, #ARGV do
    table.insert(args, ARGV[i])
  end

  local next_request = now
  if kept_next_request ~= nil then
    next_request = math.max(now, math.min(kept_next_request, now + tonumber(new_settings['minTime'])))
  end

  redis.call(unpack(args))
  redis.call('hmset', settings_key,
    'nextRequest', next_request,
    'lastReservoirRefresh', now,
    'lastReservoirIncrease', now,
    'running', get_running_weight(),
    'done', 0,
    'unblockTime', 0,
    'capacityPriorityCounter', 0
  )

else
  -- Apply migrations
  local settings = redis.call('hmget', settings_key,
    'id',
    'version'
  )
  local id = settings[1]
  local current_version = settings[2]

  if current_version ~= limiter_version then
    local current_major, current_minor, current_patch = string.match(current_version, '^(%d+)%.(%d+)%.(%d+)')
    local current = { tonumber(current_major), tonumber(current_minor), tonumber(current_patch) }

    local is_older_than = function (major, minor, patch)
      local target = { major, minor, patch }
      for i = 1, 3 do
        if current[i] ~= target[i] then
          return current[i] < target[i]
        end
      end
      return false
    end

    -- 2.10.0
    if is_older_than(2, 10, 0) then
      redis.call('hsetnx', settings_key, 'reservoirRefreshInterval', '')
      redis.call('hsetnx', settings_key, 'reservoirRefreshAmount', '')
      redis.call('hsetnx', settings_key, 'lastReservoirRefresh', '')
      redis.call('hsetnx', settings_key, 'done', 0)
      redis.call('hset', settings_key, 'version', '2.10.0')
    end

    -- 2.11.1
    if is_older_than(2, 11, 1) then
      if redis.call('hstrlen', settings_key, 'lastReservoirRefresh') == 0 then
        redis.call('hmset', settings_key,
          'lastReservoirRefresh', now,
          'version', '2.11.1'
        )
      end
    end

    -- 2.14.0
    if is_older_than(2, 14, 0) then
      local old_running_key = 'b_'..id..'_running'
      local old_executing_key = 'b_'..id..'_executing'

      if redis.call('exists', old_running_key) == 1 then
        redis.call('rename', old_running_key, job_weights_key)
      end
      if redis.call('exists', old_executing_key) == 1 then
        redis.call('rename', old_executing_key, job_expirations_key)
      end
      redis.call('hset', settings_key, 'version', '2.14.0')
    end

    -- 2.15.2
    if is_older_than(2, 15, 2) then
      redis.call('hsetnx', settings_key, 'capacityPriorityCounter', 0)
      redis.call('hset', settings_key, 'version', '2.15.2')
    end

    -- 2.17.0
    if is_older_than(2, 17, 0) then
      redis.call('hsetnx', settings_key, 'clientTimeout', 10000)
      redis.call('hset', settings_key, 'version', '2.17.0')
    end

    -- 2.18.0
    if is_older_than(2, 18, 0) then
      redis.call('hsetnx', settings_key, 'reservoirIncreaseInterval', '')
      redis.call('hsetnx', settings_key, 'reservoirIncreaseAmount', '')
      redis.call('hsetnx', settings_key, 'reservoirIncreaseMaximum', '')
      redis.call('hsetnx', settings_key, 'lastReservoirIncrease', now)
      redis.call('hset', settings_key, 'version', '2.18.0')
    end

    -- 3.0.0
    if is_older_than(3, 0, 0) then
      redis.call('hsetnx', settings_key, 'defaultExpiration', '')
      redis.call('hset', settings_key, 'version', '3.0.0')
    end

  end

  process_tick(now, false)
end

apply_default_expiration(now)

local groupTimeout = tonumber(redis.call('hget', settings_key, 'groupTimeout'))
refresh_expiration(0, 0, groupTimeout)

return {}
