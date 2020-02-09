import { dbConfig as localConfig } from './local'
import { dbConfig as prodConfig } from './production'
import { dbConfig as testConfig } from './test'

import { EnvironmentConfig } from '../model'

const cloudEnvironments = ['production', 'uat', 'integration', 'e2e-aws', 'stg']

export function getEnvironmentConfig(): EnvironmentConfig {
  let environmentConfig
  if (process.env.NODE_ENV === 'test') {
    environmentConfig = testConfig
  } else if (cloudEnvironments.includes(process.env.NODE_ENV!)) {
    environmentConfig = prodConfig
  } else {
    environmentConfig = localConfig
  }

  return environmentConfig
}
