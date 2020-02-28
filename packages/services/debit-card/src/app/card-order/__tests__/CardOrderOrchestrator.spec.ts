/* tslint:disable:max-line-length */
import { EntityManager } from 'typeorm'
import { CardOrderOrchestrator } from '../CardOrderOrchestrator'
import { Test } from '@nestjs/testing'
import { CARD_PROVIDER_FACADE_FACTORY } from '../../../shared-components/providers/debit-card-provider/CardProviderFacadeFactory'
import { CardRepository, CardOrderRequestRepository } from '../../../shared-components/repositories'
import { CardOrderRequestStatus } from '../../../shared-components/models'
import * as OrchestratorTestUtils from './CardOrderOrchestrator.test-utils'
import { CONFIG_SOURCE_TOKEN } from '../../../shared-components/providers'
/* tslint:enable:max-line-length */

describe('CardOrderOrchestrator', () => {
  let cardOrderOrchestrator: CardOrderOrchestrator

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardOrderOrchestrator,
        {
          provide: CARD_PROVIDER_FACADE_FACTORY,
          useValue: OrchestratorTestUtils.cardProviderFacadeFactory,
        },
        {
          provide: CardRepository,
          useValue: OrchestratorTestUtils.cardRepository,
        },
        {
          provide: CardOrderRequestRepository,
          useValue: OrchestratorTestUtils.cardOrderRequestRepository,
        },
        {
          provide: EntityManager,
          useValue: OrchestratorTestUtils.entityManager,
        },
        {
          provide: CONFIG_SOURCE_TOKEN,
          useValue: OrchestratorTestUtils.configSource,
        },
      ],
    }).compile()

    cardOrderOrchestrator = module.get<CardOrderOrchestrator>(CardOrderOrchestrator)
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('orderDebitCardForUser:success', () => {
    beforeEach(async () => {
      jest.spyOn(OrchestratorTestUtils.entityManager, 'transaction')
      jest
        .spyOn(OrchestratorTestUtils.cardProviderFacadeFactory, 'getCardProvider')
        .mockReturnValue(OrchestratorTestUtils.mockedCardProviderFacade)
      jest
        .spyOn(OrchestratorTestUtils.mockedCardProviderFacade, 'createAccount')
        .mockReturnValue(OrchestratorTestUtils.mockedProviderAccount)
      jest
        .spyOn(OrchestratorTestUtils.mockedCardProviderFacade, 'getProvider')
        .mockReturnValue(OrchestratorTestUtils.mockedProvider)
      jest.spyOn(OrchestratorTestUtils.cardRepository, 'createNewCard').mockReturnValue(OrchestratorTestUtils.mockedDebitCard)
      jest
        .spyOn(OrchestratorTestUtils.cardOrderRequestRepository, 'updateOrderRequestStatus')
        .mockReturnValue(OrchestratorTestUtils.mockedUpdateOrderRequestStatusResponse)

      await cardOrderOrchestrator.orderDebitCardForUser(
        OrchestratorTestUtils.accountDetails,
        OrchestratorTestUtils.cardCurrency,
        OrchestratorTestUtils.presentAddress,
      )
    })

    it('should call transaction', () => {
      expect(OrchestratorTestUtils.entityManager.transaction).toBeCalled()
    })

    it('should call getCardProvider', () => {
      expect(OrchestratorTestUtils.cardProviderFacadeFactory.getCardProvider).toBeCalledWith(OrchestratorTestUtils.cardCurrency)
    })

    it('should call createAccount', () => {
      expect(OrchestratorTestUtils.mockedCardProviderFacade.createAccount).toBeCalledWith(
        OrchestratorTestUtils.accountDetails,
        OrchestratorTestUtils.presentAddress,
      )
    })

    it('should call getProvider', () => {
      expect(OrchestratorTestUtils.mockedCardProviderFacade.getProvider).toBeCalled()
    })

    it('should call createNewCard', () => {
      expect(OrchestratorTestUtils.cardRepository.createNewCard).toBeCalledWith({
        accountId: OrchestratorTestUtils.accountDetails.id,
        provider: OrchestratorTestUtils.mockedProvider,
        providerAccountDetails: OrchestratorTestUtils.mockedProviderAccount,
        currency: OrchestratorTestUtils.cardCurrency,
        balance: -OrchestratorTestUtils.mockContisConfig.cardOrderFee,
        entityManager: OrchestratorTestUtils.transactionManager,
      })
    })

    it('should call updateOrderRequestStatus', () => {
      expect(OrchestratorTestUtils.cardOrderRequestRepository.updateOrderRequestStatus).toBeCalledWith(
        OrchestratorTestUtils.accountDetails.id,
        OrchestratorTestUtils.cardCurrency,
        CardOrderRequestStatus.completed,
        OrchestratorTestUtils.transactionManager,
      )
    })
  })

  describe('orderDebitCardForUser:provider-failure', () => {
    beforeEach(async () => {
      jest.spyOn(OrchestratorTestUtils.entityManager, 'transaction')
      jest
        .spyOn(OrchestratorTestUtils.cardProviderFacadeFactory, 'getCardProvider')
        .mockReturnValue(OrchestratorTestUtils.mockedCardProviderFacade)
      jest.spyOn(OrchestratorTestUtils.mockedCardProviderFacade, 'createAccount').mockImplementation(() => {
        throw new Error()
      })

      await cardOrderOrchestrator.orderDebitCardForUser(
        OrchestratorTestUtils.accountDetails,
        OrchestratorTestUtils.cardCurrency,
        OrchestratorTestUtils.presentAddress,
      )
    })

    it('should persist order failure', () => {
      expect(OrchestratorTestUtils.entityManager.transaction).toBeCalled()
      expect(OrchestratorTestUtils.cardProviderFacadeFactory.getCardProvider).toBeCalledWith(OrchestratorTestUtils.cardCurrency)
      expect(OrchestratorTestUtils.mockedCardProviderFacade.createAccount).toBeCalledWith(
        OrchestratorTestUtils.accountDetails,
        OrchestratorTestUtils.presentAddress,
      )

      expect(OrchestratorTestUtils.mockedCardProviderFacade.getProvider).toHaveBeenCalledTimes(1)
      expect(OrchestratorTestUtils.cardOrderRequestRepository.updateOrderRequestStatus).toHaveBeenCalledWith(
        OrchestratorTestUtils.accountDetails.id,
        OrchestratorTestUtils.cardCurrency,
        CardOrderRequestStatus.orderFailed,
        OrchestratorTestUtils.transactionManager,
      )
    })
  })
})
