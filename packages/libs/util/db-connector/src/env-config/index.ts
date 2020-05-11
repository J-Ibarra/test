import { dbConfig as localConfig } from './local'
import { dbConfig as prodConfig } from './production'
import { dbConfig as testConfig } from './test'

import { EnvironmentConfig } from '../model'
import { Environment } from '@abx-types/reference-data'

export function getEnvironmentConfig(): EnvironmentConfig {
  switch (process.env.NODE_ENV) {
    case Environment.development:
      return localConfig as any
    case Environment.test:
      return testConfig as any
    default:
      return prodConfig as any
  }
}
