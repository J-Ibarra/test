/* tslint:disable:max-line-length */
import { getRepositoryToken } from '@nestjs/typeorm'
import { Test } from '@nestjs/testing'
import { TopUpRequestRepository } from '../../../shared-components/repositories'
import { CONFIG_SOURCE_TOKEN } from '../../../shared-components/providers'
import { TopUpTracker } from '../TopUpTracker'
import { TopUpExecutor } from '../TopUpExecutor'
import { EntityManager } from 'typeorm'
import * as TopUpRecorderTestUtils from './TopUp.test-utils'

/* tslint:enable:max-line-length */

const mockRedisConfig = {
  bar: 'foo',
}

const configSource = {
  getExchangeDbConfig: jest.fn(),
  getDebitCardDbConfig: jest.fn(),
  getUserInterfaceDomain: jest.fn(),
  getLogLevel: jest.fn(),
  getContisLogin: jest.fn(),
  getContisConfig: jest.fn(),
  getCookieCryptoParams: jest.fn(),
  getJwtConfig: jest.fn(),
  getRedisConfig: () => mockRedisConfig,
}

const topUpExecutor = {
  executeTopUp: jest.fn(),
}

const topUpRequestRepository = {
  createTopUpRequest: jest.fn(),
  updateTopUpRequestByOrderId: jest.fn(),
}

const accountId = '1'
const orderId = 11
const topUpRequestId = 3
const amountToTopUp = 100
const amountFilled = 5

describe('TopUpTracker', () => {
  let topUpTracker: TopUpTracker

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TopUpTracker,
        {
          provide: TopUpExecutor,
          useValue: topUpExecutor,
        },
        {
          provide: getRepositoryToken(TopUpRequestRepository),
          useValue: topUpRequestRepository,
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: fn => fn(TopUpRecorderTestUtils.transactionManager),
          },
        },
        {
          provide: CONFIG_SOURCE_TOKEN,
          useValue: configSource,
        },
      ],
    }).compile()

    topUpTracker = module.get<TopUpTracker>(TopUpTracker)
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('recordOrderUpdate should update top up request with amount and trigger top up', async () => {
    jest.spyOn(topUpExecutor, 'executeTopUp')
    jest.spyOn(topUpRequestRepository, 'updateTopUpRequestByOrderId').mockReturnValue([topUpRequestId])

    await topUpTracker.recordOrderUpdate(topUpRequestId, accountId, orderId, amountFilled, amountToTopUp)

    expect(topUpExecutor.executeTopUp).toBeCalledWith(topUpRequestId, accountId, amountToTopUp)
    expect(topUpRequestRepository.updateTopUpRequestByOrderId).toBeCalledWith(orderId, { amountFilled })
  })
})
