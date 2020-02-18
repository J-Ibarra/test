import { Controller, Get, Route, Security } from 'tsoa'
import { getFeatureFlags } from '../core'
import { Logger } from '@abx-utils/logging'

@Route('/feature-flags')
export class FeatureFlagsController extends Controller {
  private logger = Logger.getInstance('reference-data', '')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async retrieveAllFeatureFlags() {
    this.logger.debug(`Retrieving feature flags`)
    this.logger.info(`Retrieving feature flags`)

    return getFeatureFlags()
  }
}
