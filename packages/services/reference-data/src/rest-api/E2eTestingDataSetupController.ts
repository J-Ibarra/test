import { Route, Body, Patch, Hidden, Get } from 'tsoa'
import { FeatureFlag, CurrencyCode } from '@abx-types/reference-data'
import { updateOrCreateExchangeConfig, getFeatureFlags } from '../core'
import { updateCurrencyEnabledStatus } from '../__tests__/test_utils'

@Route('test-automation')
@Hidden()
export class E2eTestingDataSetupController {
  @Get('/feature-flags')
  @Hidden()
  public async getFeatureFlags(){
    return getFeatureFlags()
  }

  @Patch('/feature-flags')
  @Hidden()
  public async updateFeatureFlags(@Body() body: {featureFlags: FeatureFlag[]}): Promise<void> {
    await updateOrCreateExchangeConfig({featureFlags: body.featureFlags})
  }

  @Patch('/currencies/status')
  @Hidden()
  public async updateCurrencyStatus(@Body() body: {currencyCode: CurrencyCode, value: boolean}): Promise<void> {
    await updateCurrencyEnabledStatus(body.currencyCode, body.value)
  }
}
