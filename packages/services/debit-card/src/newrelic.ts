/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
export const config = {
  /**
   * Array of application names.
   */
  app_name: [
    process.env.NEW_RELIC_ENVIRONMENT +
      ' Exchange:' +
      process.env.NEW_RELIC_NAME,
  ],
  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_KEY || 'invalidkey',
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level: 'info',
    // tslint:disable-next-line
    enabled: false, // This controls logging to the localFs - We want it turned off for now as it prompts a watcher to reload.
  },
}
