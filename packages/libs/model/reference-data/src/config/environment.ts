import { Environment } from './environment.enum'

export const getEnvironment = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return Environment.production
    case 'test':
      return Environment.test
    case 'e2e-local':
      return Environment.e2eLocal
    case 'e2e-aws':
      return Environment.e2eAws
    case 'integration':
      return Environment.integration
    case 'uat':
      return Environment.uat
    case 'stg':
      return Environment.staging
    default:
      return Environment.development
  }
}

export const getAwsRegionForEnvironment = (env: Environment) => {
  switch (env) {
    case Environment.e2eAws:
      return 'us-east-2'
    case Environment.staging:
      return 'eu-west-2'
    default:
      return 'ap-southeast-2'
  }
}
