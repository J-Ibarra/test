import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CardRepository, CardOrderRequestRepository } from '../../../shared-components/repositories'
import { CardDetailsOrchestrator } from '../CardDetailsOrchestrator'
import {
  CARD_PROVIDER_FACADE_FACTORY,
  BalanceSourceOfTruthComparator,
  TransactionSourceOfTruthSynchronizer,
} from '../../../shared-components/providers'
import { CurrencyCode, DebitCardStatus } from '../../../shared-components/models'
import { EntityManager } from 'typeorm'

const cardRepository = {
  getDebitCardForAccount: jest.fn(),
  getDebitCardWithBalances: jest.fn(),
}

const cardProviderFacadeFactory = {
  getCardProvider: jest.fn(),
}

const mockedCardProviderFacade = {
  getPin: jest.fn(),
  getActiveCardDetails: jest.fn(),
}

const mockedCardOrderRequestRepository = {
  getLatestOrderRequestForAccount: jest.fn(),
}

const mockedBalanceSourceOfTruthComparator = {
  syncCardBalanceWithSourceOfTruth: jest.fn(),
} as any

const mockTransactionSourceOfTruthSynchronizer = {
  synchronizeTransactionsWithSource: jest.fn(),
} as any

const entityManager = {
  transaction: transactionCallback => transactionCallback({}),
}

const debitCardStatus = DebitCardStatus.active
const debitCardCurrency = CurrencyCode.EUR

describe('CardDetailsOrchestrator', () => {
  let cardDetailsOrchestrator: CardDetailsOrchestrator

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardDetailsOrchestrator,
        {
          provide: getRepositoryToken(CardRepository),
          useValue: cardRepository,
        },
        {
          provide: CARD_PROVIDER_FACADE_FACTORY,
          useValue: cardProviderFacadeFactory,
        },
        {
          provide: CardOrderRequestRepository,
          useValue: mockedCardOrderRequestRepository,
        },
        {
          provide: BalanceSourceOfTruthComparator,
          useValue: mockedBalanceSourceOfTruthComparator,
        },
        {
          provide: TransactionSourceOfTruthSynchronizer,
          useValue: mockTransactionSourceOfTruthSynchronizer,
        },
        {
          provide: EntityManager,
          useValue: entityManager,
        },
      ],
    }).compile()

    cardDetailsOrchestrator = module.get<CardDetailsOrchestrator>(CardDetailsOrchestrator)
  })

  it('should get debit card pin', async () => {
    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue({
      consumerId: '1',
      cardId: 12,
    })

    jest.spyOn(cardProviderFacadeFactory, 'getCardProvider').mockReturnValue(mockedCardProviderFacade)
    jest.spyOn(mockedCardProviderFacade, 'getPin').mockReturnValue('1234')

    const pin = await cardDetailsOrchestrator.getPin('accountId', 'cvv', 'dob')
    expect(pin).toEqual({ pin: '1234' })
  })

  it('should get latest card balance and trigger transaction refresh if balance differs from source', async () => {
    const balanceRecorded = 11
    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue({
      consumerId: '1',
      cardId: 12,
      balance: balanceRecorded,
    })
    const balanceAtSource = 15
    const accountId = '11'
    jest.spyOn(mockedBalanceSourceOfTruthComparator, 'syncCardBalanceWithSourceOfTruth').mockResolvedValue(balanceAtSource)
    const refreshTransactionSpy = jest.spyOn(mockTransactionSourceOfTruthSynchronizer, 'synchronizeTransactionsWithSource')

    const balanceReturned = await cardDetailsOrchestrator.getLatestCardBalance(accountId)

    await new Promise(resolve => setTimeout(() => resolve(), 100))

    expect(balanceReturned).toEqual(balanceAtSource)
    expect(refreshTransactionSpy).toHaveBeenCalledWith(accountId)
  })

  it('should get on card details', async () => {
    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue({
      consumerId: '1',
      cardId: 12,
    })

    jest.spyOn(cardProviderFacadeFactory, 'getCardProvider').mockReturnValue(mockedCardProviderFacade)
    jest.spyOn(mockedCardProviderFacade, 'getActiveCardDetails').mockReturnValue({
      obscuredCardNumber: '4745-****-****-6789',
      cardDisplayName: 'Foo Bar',
    })

    const onCardDetails = await cardDetailsOrchestrator.getOnCardDetails('accountId')
    expect(onCardDetails).toEqual({ lastFourDigits: '6789', displayName: onCardDetails!.displayName })
  })

  describe('getFullCardDetails', () => {
    it('should not get card order request when card details present', async () => {
      jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue({
        currency: debitCardCurrency,
        status: debitCardStatus,
        consumerId: '1',
        cardId: 12,
        balance: 10,
      })

      const cardPublicView = await cardDetailsOrchestrator.getFullCardDetails('accountId')
      expect(cardPublicView).toEqual({
        card: {
          currency: debitCardCurrency,
          status: debitCardStatus,
          balance: 10,
        },
        cardOrdered: true,
      })
    })

    it('should get card order request when card details not present', async () => {
      jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue(null)

      jest.spyOn(mockedCardOrderRequestRepository, 'getLatestOrderRequestForAccount').mockResolvedValue({})

      const cardPublicView = await cardDetailsOrchestrator.getFullCardDetails('accountId')

      expect(cardPublicView).toEqual({
        cardOrdered: true,
      })
    })
  })
})
