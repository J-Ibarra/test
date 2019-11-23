process.env.NODE_ENV = 'test'
process.env.ABX_LOG_LEVEL = 'fatal'

//Because mocha runs from a different directory it can not find newrelic.ts - instead we just pass in the required env var.
process.env.NEW_RELIC_NO_CONFIG_FILE = true
process.env.NEW_RELIC_APP_NAME = 'requiredfortest'
process.env.NEW_RELIC_LICENSE_KEY = 'requiredfortest'

process.on('unhandledRejection', e => console.error(e))