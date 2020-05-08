import { dbConfig as localConfig } from './local'
import { dbConfig as prodConfig } from './production'
import { dbConfig as testConfig } from './test'

import { EnvironmentConfig } from '../model'
import { Environment } from '@abx-types/reference-data'

export function getEnvironmentConfig(): EnvironmentConfig {
  switch (process.env.NODE_ENV) {
    case Environment.production:
    case Environment.uat:
    case Environment.integration:
    case Environment.e2eAws:
    case Environment.staging:
    case Environment.yieldUat:
      return prodConfig as any
    case Environment.test:
      return testConfig as any
    default:
      return localConfig as any
  }
}
