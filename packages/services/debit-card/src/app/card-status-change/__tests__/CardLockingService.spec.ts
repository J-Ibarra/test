/* tslint:disable:max-line-length */
import { EntityManager } from 'typeorm'
import { Test } from '@nestjs/testing'
import { CardLockingService } from '../CardLockingService'
import { CARD_PROVIDER_FACADE_FACTORY } from '../../../shared-components/providers/debit-card-provider/CardProviderFacadeFactory'
import { CardRepository } from '../../../shared-components/repositories'
import { DebitCardStatus } from '../../../shared-components/models/card/DebitCardStatus.enum'
import * as DebitCardLockingServiceTestUtils from './CardLockingService.test-utils'
/* tslint:enable:max-line-length */

describe('CardLockingService', () => {
  let debitCardLockingService: CardLockingService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardLockingService,
        {
          provide: CardRepository,
          useValue: DebitCardLockingServiceTestUtils.cardRepository,
        },
        {
          provide: CARD_PROVIDER_FACADE_FACTORY,
          useValue: DebitCardLockingServiceTestUtils.cardProviderFacadeFactory,
        },
        {
          provide: EntityManager,
          useValue: DebitCardLockingServiceTestUtils.entityManager,
        },
      ],
    }).compile()

    debitCardLockingService = module.get<CardLockingService>(CardLockingService)
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('lockCard:success', () => {
    beforeEach(async () => {
      jest
        .spyOn(DebitCardLockingServiceTestUtils.cardRepository, 'getDebitCardForAccount')
        .mockReturnValue(DebitCardLockingServiceTestUtils.mockedDebitCard)
      jest
        .spyOn(DebitCardLockingServiceTestUtils.cardProviderFacadeFactory, 'getCardProvider')
        .mockReturnValue(DebitCardLockingServiceTestUtils.mockedCardProviderFacade)
      jest.spyOn(DebitCardLockingServiceTestUtils.mockedCardProviderFacade, 'lockCard')
      jest.spyOn(DebitCardLockingServiceTestUtils.cardRepository, 'updateCardStatus')

      await debitCardLockingService.lockCard(
        DebitCardLockingServiceTestUtils.accountId,
        DebitCardLockingServiceTestUtils.entityManager,
      )
    })

    it('should call getDebitCardForAccount', () => {
      expect(DebitCardLockingServiceTestUtils.cardRepository.getDebitCardForAccount).toBeCalledWith(
        DebitCardLockingServiceTestUtils.accountId,
        DebitCardLockingServiceTestUtils.entityManager,
      )
    })

    it('should call getCardProvider', () => {
      expect(DebitCardLockingServiceTestUtils.cardProviderFacadeFactory.getCardProvider).toBeCalledWith(
        DebitCardLockingServiceTestUtils.mockedDebitCard.currency,
      )
    })

    it('should call lockCard', () => {
      expect(DebitCardLockingServiceTestUtils.mockedCardProviderFacade.lockCard).toBeCalledWith(
        DebitCardLockingServiceTestUtils.mockedDebitCard.providerAccountDetails,
      )
    })

    it('should call updateCardStatus', () => {
      expect(DebitCardLockingServiceTestUtils.cardRepository.updateCardStatus).toBeCalledWith(
        DebitCardLockingServiceTestUtils.mockedDebitCard.providerAccountDetails,
        DebitCardStatus.lockedOut,
        DebitCardLockingServiceTestUtils.entityManager,
      )
    })
  })
})
