/** The list of all environments that the app could run in. */
export enum Environment {
  /** The local development environment. */
  development = 'dev',
  /** The test execution environment, used when integration tests are executed locally. */
  test = 'test',
  /** The CI execution environment, used when integration tests are executed by the CI. */
  ci = 'ci',

  integration = 'integration',
  uat = 'uat',
  prod = 'production',
}
