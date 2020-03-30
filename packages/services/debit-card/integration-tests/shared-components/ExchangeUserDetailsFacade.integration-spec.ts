import { EpicurusPublicInterface } from 'epicurus-node'

import {
  ExchangeUserDetailsFacade,
  ConfigSourceFactory,
} from '../../src/shared-components/providers'
import { getEpicurusInstance } from '../../src/shared-components/providers/redis/EpicurusClient'
import { defaultCompleteAccountDetails } from '../utils/test-data'

describe('ExchangeUserDetailsFacade', () => {
  let userDetailsFacade: ExchangeUserDetailsFacade
  let epicurus: EpicurusPublicInterface
  const accountIdSetterStub = jest.fn()

  beforeAll(async () => {
    const config = ConfigSourceFactory.getConfigSourceForEnvironment()
    userDetailsFacade = new ExchangeUserDetailsFacade(
      ConfigSourceFactory.getConfigSourceForEnvironment(),
    )
    epicurus = getEpicurusInstance(config.getRedisConfig())
    epicurus.server(
      'datasetRetrieval:extendedUserDetails',
      ({ accountId }: any, respond: (err: any, response?: any) => void) => {
        accountIdSetterStub(accountId)
        respond(null, defaultCompleteAccountDetails)
      },
    )
  })

  afterEach(() => epicurus.shutdown())

  // tslint:disable-next-line:max-line-length
  it('should use datasetRetrieval:extendedUserDetails channel to request details when calling getFullAccountDetails', async () => {
    const testAccountId = 'fooBar'
    const accountDetails = await userDetailsFacade.getFullAccountDetails(
      testAccountId,
    )

    expect(accountDetails).toEqual(defaultCompleteAccountDetails)
    expect(accountIdSetterStub).toHaveBeenCalledWith(testAccountId)
  })
})
