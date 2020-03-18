import { Test } from '@nestjs/testing'
import { EntityManager } from 'typeorm'

import { PLACE_ORDER_FACADE_TOKEN } from '../../../shared-components/providers'
import { CardRepository, TopUpRequestRepository } from '../../../shared-components/repositories'
import * as TopUpRecorderTestUtils from './TopUp.test-utils'
import { TopUpExecutor } from '../TopUpExecutor'
import { TopUpBalanceReserver } from '../request-dispatcher/TopUpBalanceReserver'
import { TopUpRequestDispatcher } from '../request-dispatcher/TopUpRequestDispatcher'
import { TopUpRequestStatus } from '../../../shared-components/models'

const topUpBalanceReserver = {
  reserveAllowedAmount: jest.fn(),
}

const topUpRequestDispatcher = {
  loadAmountOnCard: jest.fn(),
}

const topUpRequestId = 1
const topUpAmount = 10

describe('TopUpExecutor', () => {
  let topUpExecutor: TopUpExecutor

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TopUpExecutor,
        {
          provide: CardRepository,
          useValue: TopUpRecorderTestUtils.cardRepository,
        },
        {
          provide: TopUpRequestRepository,
          useValue: TopUpRecorderTestUtils.topUpRequestRepository,
        },
        {
          provide: PLACE_ORDER_FACADE_TOKEN,
          useValue: TopUpRecorderTestUtils.placeOrderFacade,
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: fn => fn(TopUpRecorderTestUtils.transactionManager),
          },
        },
        {
          provide: TopUpBalanceReserver,
          useValue: topUpBalanceReserver,
        },
        {
          provide: TopUpRequestDispatcher,
          useValue: topUpRequestDispatcher,
        },
      ],
    }).compile()

    topUpExecutor = module.get<TopUpExecutor>(TopUpExecutor)
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('should not execute top up when request status not orderPlaced', () => {
    jest.spyOn(TopUpRecorderTestUtils.topUpRequestRepository, 'getTopUpRequest').mockReturnValue({
      id: topUpRequestId,
      status: TopUpRequestStatus.complete,
    })

    topUpExecutor.executeTopUp(topUpRequestId, TopUpRecorderTestUtils.accountId, topUpAmount)

    expect(TopUpRecorderTestUtils.cardRepository.getDebitCardForAccount).not.toHaveBeenCalled()

    expect(topUpBalanceReserver.reserveAllowedAmount).not.toHaveBeenCalled()
  })

  it('should not load balance when amount reserved is 0', async () => {
    const amountReserved = 0
    jest.spyOn(TopUpRecorderTestUtils.topUpRequestRepository, 'getTopUpRequest').mockReturnValue({
      id: topUpRequestId,
      status: TopUpRequestStatus.orderPlaced,
    })

    jest
      .spyOn(TopUpRecorderTestUtils.cardRepository, 'getDebitCardForAccountWithPessimisticLock')
      .mockReturnValue(TopUpRecorderTestUtils.mockedDebitCard)

    jest.spyOn(topUpBalanceReserver, 'reserveAllowedAmount').mockReturnValue({ amountReserved })

    await topUpExecutor.executeTopUp(topUpRequestId, TopUpRecorderTestUtils.accountId, topUpAmount)

    expect(TopUpRecorderTestUtils.cardRepository.getDebitCardForAccountWithPessimisticLock).toHaveBeenCalledWith(
      TopUpRecorderTestUtils.mockedDebitCard.accountId,
      TopUpRecorderTestUtils.transactionManager,
    )

    expect(topUpBalanceReserver.reserveAllowedAmount).toHaveBeenCalledWith(
      {
        id: topUpRequestId,
        status: TopUpRequestStatus.orderPlaced,
      },
      TopUpRecorderTestUtils.mockedDebitCard,
      topUpAmount,
      TopUpRecorderTestUtils.transactionManager,
    )

    expect(topUpRequestDispatcher.loadAmountOnCard).not.toHaveBeenCalled()
  })

  it('should record top up success when balance successfully loaded', async () => {
    const topUpRequest = {
      id: topUpRequestId,
      status: TopUpRequestStatus.orderPlaced,
    }
    const providerTransactionId = 11

    const amountReserved = 5
    jest.spyOn(TopUpRecorderTestUtils.topUpRequestRepository, 'getTopUpRequest').mockReturnValue(topUpRequest)

    jest
      .spyOn(TopUpRecorderTestUtils.cardRepository, 'getDebitCardForAccountWithPessimisticLock')
      .mockReturnValue(TopUpRecorderTestUtils.mockedDebitCard)
    jest.spyOn(topUpBalanceReserver, 'reserveAllowedAmount').mockReturnValue({ amountReserved })
    jest
      .spyOn(topUpRequestDispatcher, 'loadAmountOnCard')
      .mockResolvedValue({ success: true, transactionId: providerTransactionId })

    await topUpExecutor.executeTopUp(topUpRequestId, TopUpRecorderTestUtils.accountId, topUpAmount)

    expect(TopUpRecorderTestUtils.cardRepository.getDebitCardForAccountWithPessimisticLock).toHaveBeenCalledWith(
      TopUpRecorderTestUtils.mockedDebitCard.accountId,
      TopUpRecorderTestUtils.transactionManager,
    )

    expect(topUpBalanceReserver.reserveAllowedAmount).toHaveBeenCalledWith(
      topUpRequest,
      TopUpRecorderTestUtils.mockedDebitCard,
      topUpAmount,
      TopUpRecorderTestUtils.transactionManager,
    )

    expect(topUpRequestDispatcher.loadAmountOnCard).toHaveBeenCalledWith(
      TopUpRecorderTestUtils.mockedDebitCard,
      amountReserved,
      topUpRequestId,
      TopUpRecorderTestUtils.transactionManager,
    )
  })
})
