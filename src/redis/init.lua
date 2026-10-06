local clear = tonumber(ARGV[num_static_argv + 1])
local limiter_version = ARGV[num_static_argv + 2]
local num_local_argv = num_static_argv + 2

local new_settings = {}
for i = num_local_argv + 1, #ARGV, 2 do
  new_settings[ARGV[i]] = ARGV[i + 1]
end

--
-- Clear
--
local get_responsive_clients = function ()
  local responsive_clients = {}
  local seen_since = now - tonumber(new_settings['clientTimeout'])
  for _, responsive_client in ipairs(redis.call('zrangebyscore', client_last_seen_key, seen_since, '+inf')) do
    responsive_clients[responsive_client] = true
  end
  return responsive_clients
end

local remove_jobs_of_unresponsive_clients = function (responsive_clients)
  local clients_running_jobs = {}
  local job_clients = redis.call('hgetall', job_clients_key)
  for i = 1, #job_clients, 2 do
    local index, job_client = job_clients[i], job_clients[i + 1]
    if responsive_clients[job_client] then
      clients_running_jobs[job_client] = true
    else
      redis.call('hdel', job_weights_key, index)
      redis.call('hdel', job_clients_key, index)
      redis.call('zrem', job_expirations_key, index)
    end
  end
  return clients_running_jobs
end

-- They register again, with their current queue, on their next call
local unregister_clients_without_running_jobs = function (clients_running_jobs)
  for _, registered_client in ipairs(redis.call('zrange', client_last_seen_key, 0, -1)) do
    if not clients_running_jobs[registered_client] then
      redis.call('zrem', client_running_key, registered_client)
      redis.call('hdel', client_num_queued_key, registered_client)
      redis.call('zrem', client_last_registered_key, registered_client)
      redis.call('zrem', client_last_seen_key, registered_client)
    end
  end
end

-- Responsive clients keep the spacing of the last job, but never for longer than the new minTime
local get_next_request_after_clear = function (responsive_clients)
  local next_request = tonumber(redis.call('hget', settings_key, 'nextRequest'))
  if next(responsive_clients) == nil or next_request == nil then
    return now
  end
  return math.max(now, math.min(next_request, now + tonumber(new_settings['minTime'])))
end

-- Responsive clients keep their running jobs, so a clear never lets them exceed the limits
local clear_datastore = function ()
  local responsive_clients = get_responsive_clients()
  local next_request = get_next_request_after_clear(responsive_clients)

  redis.call('del', settings_key)
  unregister_clients_without_running_jobs(remove_jobs_of_unresponsive_clients(responsive_clients))

  return next_request
end

--
-- Create
--
local get_running_weight = function ()
  local running = 0
  for _, weight in ipairs(redis.call('hvals', job_weights_key)) do
    running = running + tonumber(weight)
  end
  return running
end

-- Jobs can still be running when the settings were cleared or lost, so running is counted from them
local create_settings = function (next_request)
  redis.call('hmset', settings_key, unpack(ARGV, num_local_argv + 1))
  redis.call('hmset', settings_key,
    'nextRequest', next_request,
    'lastReservoirRefresh', now,
    'lastReservoirIncrease', now,
    'running', get_running_weight(),
    'done', 0,
    'unblockTime', 0,
    'capacityPriorityCounter', 0
  )
end

--
-- Migrate
--
local parse_version = function (version)
  local major, minor, patch = string.match(version, '^(%d+)%.(%d+)%.(%d+)')
  return { tonumber(major), tonumber(minor), tonumber(patch) }
end

local is_older_than = function (version, target_version)
  for i = 1, 3 do
    if version[i] ~= target_version[i] then
      return version[i] < target_version[i]
    end
  end
  return false
end

local migrations = {
  { '2.10.0', function ()
    redis.call('hsetnx', settings_key, 'reservoirRefreshInterval', '')
    redis.call('hsetnx', settings_key, 'reservoirRefreshAmount', '')
    redis.call('hsetnx', settings_key, 'lastReservoirRefresh', '')
    redis.call('hsetnx', settings_key, 'done', 0)
  end },
  { '2.11.1', function ()
    if redis.call('hstrlen', settings_key, 'lastReservoirRefresh') == 0 then
      redis.call('hset', settings_key, 'lastReservoirRefresh', now)
    end
  end },
  { '2.14.0', function (id)
    local old_running_key = 'b_'..id..'_running'
    local old_executing_key = 'b_'..id..'_executing'
    if redis.call('exists', old_running_key) == 1 then
      redis.call('rename', old_running_key, job_weights_key)
    end
    if redis.call('exists', old_executing_key) == 1 then
      redis.call('rename', old_executing_key, job_expirations_key)
    end
  end },
  { '2.15.2', function ()
    redis.call('hsetnx', settings_key, 'capacityPriorityCounter', 0)
  end },
  { '2.17.0', function ()
    redis.call('hsetnx', settings_key, 'clientTimeout', 10000)
  end },
  { '2.18.0', function ()
    redis.call('hsetnx', settings_key, 'reservoirIncreaseInterval', '')
    redis.call('hsetnx', settings_key, 'reservoirIncreaseAmount', '')
    redis.call('hsetnx', settings_key, 'reservoirIncreaseMaximum', '')
    redis.call('hsetnx', settings_key, 'lastReservoirIncrease', now)
  end },
  { '3.0.0', function ()
    redis.call('hsetnx', settings_key, 'defaultExpiration', '')
  end }
}

local migrate_settings = function ()
  local id, stored_version = unpack(redis.call('hmget', settings_key, 'id', 'version'))
  if stored_version == limiter_version then
    return
  end

  local version = parse_version(stored_version)
  for _, migration in ipairs(migrations) do
    local migration_version, apply = migration[1], migration[2]
    if is_older_than(version, parse_version(migration_version)) then
      apply(id)
      redis.call('hset', settings_key, 'version', migration_version)
    end
  end
end

--
-- Init
--
local next_request = now
if clear == 1 then
  next_request = clear_datastore()
end

if redis.call('exists', settings_key) == 0 then
  create_settings(next_request)
else
  migrate_settings()
  process_tick(now, false)
end

apply_default_expiration(now)

local groupTimeout = tonumber(redis.call('hget', settings_key, 'groupTimeout'))
refresh_expiration(0, 0, groupTimeout)

return {}
