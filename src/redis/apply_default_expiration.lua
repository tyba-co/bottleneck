local apply_default_expiration = function (now)
  local defaultExpiration = tonumber(redis.call('hget', settings_key, 'defaultExpiration'))

  if defaultExpiration ~= nil then
    local running_indexes = redis.call('hkeys', job_weights_key)

    for i = 1, #running_indexes do
      redis.call('zadd', job_expirations_key, 'NX', now + defaultExpiration, running_indexes[i])
    end
  end
end
