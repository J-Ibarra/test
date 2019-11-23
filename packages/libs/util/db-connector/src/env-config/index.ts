import localConfig from './local'
import prodConfig from './production'
import testConfig from './test'

import { EnvironmentConfig } from '../model'

// Determine the correct environmental configuration to return

const cloudEnvironments = ['production', 'uat', 'integration', 'test-automation']

let environmentConfig
if (process.env.NODE_ENV === 'test') {
  environmentConfig = testConfig
} else if (cloudEnvironments.includes(process.env.NODE_ENV!)) {
  environmentConfig = prodConfig
} else {
  environmentConfig = localConfig
}

export default environmentConfig as EnvironmentConfig
