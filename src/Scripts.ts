const lua = require("./lua.json");

const headers: { [key: string]: any } = {
  refs: lua["refs.lua"],
  validate_keys: lua["validate_keys.lua"],
  validate_client: lua["validate_client.lua"],
  refresh_expiration: lua["refresh_expiration.lua"],
  apply_default_expiration: lua["apply_default_expiration.lua"],
  process_tick: lua["process_tick.lua"],
  conditions_check: lua["conditions_check.lua"],
  get_time: lua["get_time.lua"]
};

export const allKeys = (id: string): string[] => [
  // HASH
  `b_${id}_settings`,

  // HASH
  // job index -> weight
  `b_${id}_job_weights`,

  // ZSET
  // job index -> expiration
  `b_${id}_job_expirations`,

  // HASH
  // job index -> client
  `b_${id}_job_clients`,

  // ZSET
  // client -> sum running
  `b_${id}_client_running`,

  // HASH
  // client -> num queued
  `b_${id}_client_num_queued`,

  // ZSET
  // client -> last job registered
  `b_${id}_client_last_registered`,

  // ZSET
  // client -> last seen
  `b_${id}_client_last_seen`
];

interface ScriptTemplate {
  keys: (id: string) => string[];
  headers: string[];
  refresh_expiration: boolean;
  code: string;
}

const templates: { [name: string]: ScriptTemplate } = {
  init: {
    keys: allKeys,
    headers: ["apply_default_expiration", "process_tick"],
    refresh_expiration: true,
    code: lua["init.lua"]
  },
  group_check: {
    keys: allKeys,
    headers: [],
    refresh_expiration: false,
    code: lua["group_check.lua"]
  },
  register_client: {
    keys: allKeys,
    headers: ["validate_keys"],
    refresh_expiration: false,
    code: lua["register_client.lua"]
  },
  unregister_client: {
    keys: allKeys,
    headers: ["process_tick"],
    refresh_expiration: false,
    code: lua["unregister_client.lua"]
  },
  blacklist_client: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client"],
    refresh_expiration: false,
    code: lua["blacklist_client.lua"]
  },
  heartbeat: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "apply_default_expiration", "process_tick"],
    refresh_expiration: false,
    code: lua["heartbeat.lua"]
  },
  update_settings: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "apply_default_expiration", "process_tick"],
    refresh_expiration: true,
    code: lua["update_settings.lua"]
  },
  running: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick"],
    refresh_expiration: false,
    code: lua["running.lua"]
  },
  queued: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client"],
    refresh_expiration: false,
    code: lua["queued.lua"]
  },
  done: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick"],
    refresh_expiration: false,
    code: lua["done.lua"]
  },
  check: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick", "conditions_check"],
    refresh_expiration: false,
    code: lua["check.lua"]
  },
  submit: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick", "conditions_check"],
    refresh_expiration: true,
    code: lua["submit.lua"]
  },
  register: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick", "conditions_check"],
    refresh_expiration: true,
    code: lua["register.lua"]
  },
  free: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick"],
    refresh_expiration: true,
    code: lua["free.lua"]
  },
  current_reservoir: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick"],
    refresh_expiration: false,
    code: lua["current_reservoir.lua"]
  },
  increment_reservoir: {
    keys: allKeys,
    headers: ["validate_keys", "validate_client", "process_tick"],
    refresh_expiration: true,
    code: lua["increment_reservoir.lua"]
  }
};

export const names = Object.keys(templates);

export const keys = (name: string, id: string): string[] => {
  return templates[name].keys(id);
};

export const payload = (name: string): string => {
  const template = templates[name];
  return [
    headers.refs,
    ...template.headers.map((h) => headers[h]),
    ...(template.refresh_expiration ? [headers.refresh_expiration] : [""]),
    template.code
  ].join("\n");
};
