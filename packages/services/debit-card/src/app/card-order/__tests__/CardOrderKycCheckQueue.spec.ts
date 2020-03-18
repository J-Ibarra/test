import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { EntityManager } from 'typeorm'
import { CardOrderKycCheckQueue } from '../CardOrderKycCheckQueue'
import { CardOrderRequest, CurrencyCode, CardOrderRequestStatus } from '../../../shared-components/models'
import { CardOrderOrchestrator } from '../CardOrderOrchestrator'
import { CONFIG_SOURCE_TOKEN, USER_DETAILS_FACADE_TOKEN } from '../../../shared-components/providers'

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

const cardOrderRequestRepository = {
  getOrderRequestsByStatus: jest.fn(),
  updateOrderRequestStatus: jest.fn(),
  getLatestOrderRequestForAccount: jest.fn(),
}

const exchangeUserDetailsFacade = {
  getFullAccountDetails: jest.fn(),
}

const cardOrderOrchestrator = {
  orderDebitCardForUser: jest.fn(),
}

const transactionManager = {} as any

const entityManager = {
  transaction: transactionCallback => transactionCallback(transactionManager),
}

describe('CardOrderKycCheckQueue', () => {
  let cardOrderKycCheckQueue: CardOrderKycCheckQueue

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardOrderKycCheckQueue,
        {
          provide: CONFIG_SOURCE_TOKEN,
          useValue: configSource,
        },
        {
          provide: getRepositoryToken(CardOrderRequest),
          useValue: cardOrderRequestRepository,
        },
        {
          provide: USER_DETAILS_FACADE_TOKEN,
          useValue: exchangeUserDetailsFacade,
        },
        {
          provide: CardOrderOrchestrator,
          useValue: cardOrderOrchestrator,
        },
        {
          provide: EntityManager,
          useValue: entityManager,
        },
      ],
    }).compile()

    cardOrderKycCheckQueue = module.get<CardOrderKycCheckQueue>(CardOrderKycCheckQueue)
  })

  describe('triggerCardOrderForVerifiedUsers', () => {
    const mockedRequests = [
      {
        accountId: '1',
        initialDeposit: 100,
        currency: CurrencyCode.EUR,
      },
    ]
    const mockedUser = {}

    beforeEach(async () => {
      jest.spyOn(entityManager, 'transaction')
      jest
        .spyOn(cardOrderRequestRepository, 'getOrderRequestsByStatus')
        .mockImplementation(() => Promise.resolve(mockedRequests))
      jest.spyOn(exchangeUserDetailsFacade, 'getFullAccountDetails').mockReturnValue(mockedUser)
      jest.spyOn(cardOrderOrchestrator, 'orderDebitCardForUser')

      await cardOrderKycCheckQueue.triggerCardOrderForVerifiedUsers()
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should call transaction', () => {
      expect(entityManager.transaction).toBeCalled()
    })

    it('should call getOrderRequestsByStatus', () => {
      expect(cardOrderRequestRepository.getOrderRequestsByStatus).toBeCalledWith(
        CardOrderRequestStatus.kycVerified,
        transactionManager,
        true,
      )
    })

    it('should call getFullAccountDetails for each request', () => {
      expect(exchangeUserDetailsFacade.getFullAccountDetails).toBeCalledTimes(mockedRequests.length)
    })

    it('should call orderDebitCardForUser for each requerst', () => {
      expect(cardOrderOrchestrator.orderDebitCardForUser).toBeCalledTimes(mockedRequests.length)
    })
  })

  describe('recordKycCheckChange', () => {
    const mockedAccountId = '1'
    const mockedStatus = 'approved'

    beforeEach(() => {
      jest.spyOn(entityManager, 'transaction')
      jest.spyOn(cardOrderRequestRepository, 'updateOrderRequestStatus')
    })

    describe('when order request for account is \'verified\' or \'rejected\'', () => {
      const mockedRequest = {
        accountId: mockedAccountId,
        status: CardOrderRequestStatus.kycVerified,
        currency: CurrencyCode.EUR,
      }

      beforeEach(async () => {
        jest
          .spyOn(cardOrderRequestRepository, 'getLatestOrderRequestForAccount')
          .mockImplementation(() => Promise.resolve(mockedRequest))

        await cardOrderKycCheckQueue.recordKycCheckChange(mockedAccountId, mockedStatus)
      })

      it('should call transaction', () => {
        expect(entityManager.transaction).toBeCalled()
      })

      it('should call getLatestOrderRequestForAccount', () => {
        expect(cardOrderRequestRepository.getLatestOrderRequestForAccount).toBeCalledWith(
          mockedAccountId,
          transactionManager,
          true,
        )
      })

      it('should not call updateOrderRequestStatus', () => {
        expect(cardOrderRequestRepository.updateOrderRequestStatus).toBeCalledTimes(0)
      })
    })

    describe('when order request for account is not \'verified\' or \'rejected\'', () => {
      const mockedRequest = {
        accountId: mockedAccountId,
        status: CardOrderRequestStatus.kycPending,
        currency: CurrencyCode.EUR,
      }

      beforeEach(async () => {
        jest
          .spyOn(cardOrderRequestRepository, 'getLatestOrderRequestForAccount')
          .mockImplementation(() => Promise.resolve(mockedRequest))

        await cardOrderKycCheckQueue.recordKycCheckChange(mockedAccountId, mockedStatus)
      })

      it('should call transaction', () => {
        expect(entityManager.transaction).toBeCalled()
      })

      it('should call getLatestOrderRequestForAccount', () => {
        expect(cardOrderRequestRepository.getLatestOrderRequestForAccount).toBeCalledWith(
          mockedAccountId,
          transactionManager,
          true,
        )
      })

      it('should call updateOrderRequestStatus', () => {
        expect(cardOrderRequestRepository.updateOrderRequestStatus).toBeCalledWith(
          mockedRequest.accountId,
          mockedRequest.currency,
          CardOrderRequestStatus.kycVerified,
          transactionManager,
        )
      })
    })
  })
})
