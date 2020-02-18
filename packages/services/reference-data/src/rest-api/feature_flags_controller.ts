import { Controller, Get, Route, Security } from 'tsoa'
import { getFeatureFlags } from '../core'

@Route('/feature-flags')
export class FeatureFlagsController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async retrieveAllFeatureFlags() {
    return getFeatureFlags()
  }
}
