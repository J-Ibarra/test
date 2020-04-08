import { Controller, Get, Route, Security, Tags } from 'tsoa'
import { getFeatureFlags } from '../core'

@Tags('reference-data')
@Route('/feature-flags')
export class FeatureFlagsController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async retrieveAllFeatureFlags() {
    return getFeatureFlags()
  }
}
