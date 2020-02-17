exports.config = {
  app_name: [`KBE-${process.env.ABX_NEW_RELIC_ENVIRONMENT.toUpperCase()} service:${process.env.ABX_NEW_RELIC_NAME}`],
  license_key: process.env.NEW_RELIC_KEY || 'invalidkey',
  logging: {
    enabled: true,
    level: 'info'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*',
    ],
  },
  apdex_t: process.env.NEW_RELIC_APDEX || 0.1,
  transaction_tracer: {
    record_sql: 'obfuscated',
  },
  slow_sql: {
    enabled: true,
  },
  distributed_tracing: {
    enabled: true,
  },
}