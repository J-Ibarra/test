export enum Environment {
  development = 'development',
  e2eLocal = 'e2e-local',
  e2eAws = 'e2e-aws',
  test = 'test',
  production = 'production',
  integration = 'integration',
  staging = 'staging',
  uat = 'uat',
}

export const e2eTestingEnvironments = [Environment.e2eLocal, Environment.e2eAws]
export const localTestEnvironments = [Environment.e2eLocal, Environment.test]
export const localAndTestEnvironments = [...e2eTestingEnvironments, Environment.test, Environment.development]
