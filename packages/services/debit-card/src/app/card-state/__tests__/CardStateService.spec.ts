/* tslint:disable:max-line-length */
import { EntityManager } from 'typeorm'
import { Test } from '@nestjs/testing'
import { CardStateService } from '../CardStateService'
import { CARD_PROVIDER_FACADE_FACTORY } from '../../../shared-components/providers/debit-card-provider/CardProviderFacadeFactory'
import { CardRepository } from '../../../shared-components/repositories'
import { DebitCardStatus } from '../../../shared-components/models/card/DebitCardStatus.enum'
import * as CardLockingServiceTestUtils from './CardStateService.test-utils'
/* tslint:enable:max-line-length */

describe('CardStateService', () => {
  let cardStateService: CardStateService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardStateService,
        {
          provide: CardRepository,
          useValue: CardLockingServiceTestUtils.cardRepository,
        },
        {
          provide: CARD_PROVIDER_FACADE_FACTORY,
          useValue: CardLockingServiceTestUtils.cardProviderFacadeFactory,
        },
        {
          provide: EntityManager,
          useValue: CardLockingServiceTestUtils.entityManager,
        },
      ],
    }).compile()

    cardStateService = module.get<CardStateService>(CardStateService)
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  describe('lockCard:success', () => {
    beforeEach(async () => {
      jest
        .spyOn(CardLockingServiceTestUtils.cardRepository, 'getDebitCardForAccount')
        .mockReturnValue(CardLockingServiceTestUtils.mockedDebitCard)
      jest
        .spyOn(CardLockingServiceTestUtils.cardProviderFacadeFactory, 'getCardProvider')
        .mockReturnValue(CardLockingServiceTestUtils.mockedCardProviderFacade)
      jest.spyOn(CardLockingServiceTestUtils.mockedCardProviderFacade, 'lockCard')
      jest.spyOn(CardLockingServiceTestUtils.cardRepository, 'updateCardStatus')

      await cardStateService.lockCard(CardLockingServiceTestUtils.accountId, CardLockingServiceTestUtils.entityManager)
    })

    it('should call getDebitCardForAccount', () => {
      expect(CardLockingServiceTestUtils.cardRepository.getDebitCardForAccount).toBeCalledWith(
        CardLockingServiceTestUtils.accountId,
        CardLockingServiceTestUtils.entityManager,
      )
    })

    it('should call getCardProvider', () => {
      expect(CardLockingServiceTestUtils.cardProviderFacadeFactory.getCardProvider).toBeCalledWith(
        CardLockingServiceTestUtils.mockedDebitCard.currency,
      )
    })

    it('should call lockCard', () => {
      expect(CardLockingServiceTestUtils.mockedCardProviderFacade.lockCard).toBeCalledWith(
        CardLockingServiceTestUtils.mockedDebitCard.providerAccountDetails,
      )
    })

    it('should call updateCardStatus', () => {
      expect(CardLockingServiceTestUtils.cardRepository.updateCardStatus).toBeCalledWith(
        CardLockingServiceTestUtils.mockedDebitCard.providerAccountDetails,
        DebitCardStatus.lockedOut,
        CardLockingServiceTestUtils.entityManager,
      )
    })
  })

  describe('setCardStateNormal:success', () => {
    beforeEach(async () => {
      jest
        .spyOn(CardLockingServiceTestUtils.cardRepository, 'getDebitCardForAccount')
        .mockReturnValue(CardLockingServiceTestUtils.mockedDebitCard)
      jest
        .spyOn(CardLockingServiceTestUtils.cardProviderFacadeFactory, 'getCardProvider')
        .mockReturnValue(CardLockingServiceTestUtils.mockedCardProviderFacade)
      jest.spyOn(CardLockingServiceTestUtils.mockedCardProviderFacade, 'unlockCard')
      jest.spyOn(CardLockingServiceTestUtils.cardRepository, 'updateCardStatus')

      await cardStateService.unlockCard(
        CardLockingServiceTestUtils.accountId,
        CardLockingServiceTestUtils.entityManager,
      )
    })

    it('should call unlockCard', () => {
      expect(CardLockingServiceTestUtils.mockedCardProviderFacade.unlockCard).toBeCalledWith(
        CardLockingServiceTestUtils.mockedDebitCard.providerAccountDetails,
      )
    })

    it('should call updateCardStatus', () => {
      expect(CardLockingServiceTestUtils.cardRepository.updateCardStatus).toBeCalledWith(
        CardLockingServiceTestUtils.mockedDebitCard.providerAccountDetails,
        DebitCardStatus.active,
        CardLockingServiceTestUtils.entityManager,
      )
    })
  })
})
