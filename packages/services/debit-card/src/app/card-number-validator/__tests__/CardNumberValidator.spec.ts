import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CardRepository } from '../../../shared-components/repositories'
import { CARD_PROVIDER_FACADE_FACTORY } from '../../../shared-components/providers'
import { CardNumberValidator } from '../CardNumberValidator'
import {
  DebitCard,
  DebitCardProvider,
  CurrencyCode,
  DebitCardStatus,
  ContisAccountDetails,
} from '../../../shared-components/models'
import { CardActivationAttemptValidator } from '../CardActivationAttemptValidatior'

const cardRepository = {
  getDebitCardForAccount: jest.fn(),
  updateCardStatus: jest.fn(),
  updateCardWhereProviderDetailsMatch: jest.fn(),
}

const cardProviderFacadeFactory = {
  getCardProvider: jest.fn(),
}

const mockedCardProviderFacade = {
  validateLastFourDigits: jest.fn(),
  activateCard: jest.fn(),
  getLatestCardDetails: jest.fn(),
}

const cardActivationAttemptValidator = {
  maximumDailyActivationAttemptsExceeded: () => jest.fn(),
} as any

const accountId = '1'
const cardId = 12
const cvv = '123'
const dateOfBirth = '1960-05-24'
const debitCardBalance = 12

describe('CardNumberValidator', () => {
  let cardNumberValidator: CardNumberValidator

  beforeEach(async () => {
    jest.resetAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        CardNumberValidator,
        {
          provide: getRepositoryToken(CardRepository),
          useValue: cardRepository,
        },
        {
          provide: CardActivationAttemptValidator,
          useValue: cardActivationAttemptValidator,
        },
        {
          provide: CARD_PROVIDER_FACADE_FACTORY,
          useValue: cardProviderFacadeFactory,
        },
      ],
    }).compile()

    cardNumberValidator = module.get<CardNumberValidator>(CardNumberValidator)
    cardRepository.updateCardWhereProviderDetailsMatch.mockResolvedValue({})
  })

  it('should validate card number successfully and update status, card not lost or damaged', async () => {
    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockImplementation(() =>
      Promise.resolve(
        new DebitCard(
          accountId,
          DebitCardProvider.contis,
          new ContisAccountDetails({
            consumerId: '1',
            cardId,
          }),
          CurrencyCode.EUR,
          DebitCardStatus.active,
          debitCardBalance,
        ),
      ),
    )

    jest.spyOn(mockedCardProviderFacade, 'getLatestCardDetails').mockReturnValue({
      id: cardId,
    } as any)
    jest.spyOn(cardProviderFacadeFactory, 'getCardProvider').mockReturnValue(mockedCardProviderFacade)
    jest.spyOn(mockedCardProviderFacade, 'validateLastFourDigits').mockReturnValue({ valid: true })
    jest
      .spyOn(cardActivationAttemptValidator, 'maximumDailyActivationAttemptsExceeded')
      .mockReturnValue({ attemptsExceeded: false })

    const result = await cardNumberValidator.validateLastFourDigits('accountId', '6789', cvv, dateOfBirth)
    expect(result).toEqual({
      valid: true,
      card: {
        balance: debitCardBalance,
        currency: 'EUR',
        status: DebitCardStatus.active,
      },
    })
  })

  it('should validate card number successfully and update status, card lost or damaged', async () => {
    const newCardId = 13
    const oldProviderAccountDetails = new ContisAccountDetails({
      accountId: 1,
      consumerId: '1',
      cardId,
    })

    const card = new DebitCard(
      accountId,
      DebitCardProvider.contis,
      oldProviderAccountDetails,
      CurrencyCode.EUR,
      DebitCardStatus.lost,
      debitCardBalance,
    )

    jest.spyOn(mockedCardProviderFacade, 'getLatestCardDetails').mockReturnValue({
      id: newCardId,
    } as any)
    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockResolvedValue(card)
    jest.spyOn(cardProviderFacadeFactory, 'getCardProvider').mockReturnValue(mockedCardProviderFacade)
    jest.spyOn(mockedCardProviderFacade, 'validateLastFourDigits').mockReturnValue({ valid: true })
    jest
      .spyOn(cardActivationAttemptValidator, 'maximumDailyActivationAttemptsExceeded')
      .mockReturnValue({ attemptsExceeded: false })

    const result = await cardNumberValidator.validateLastFourDigits('accountId', '6789', cvv, dateOfBirth)
    expect(cardRepository.updateCardWhereProviderDetailsMatch).toHaveBeenCalledWith(oldProviderAccountDetails, {
      providerAccountDetails: {
        ...oldProviderAccountDetails,
        cardId: newCardId,
      },
    })
    expect(mockedCardProviderFacade.activateCard).toHaveBeenCalledWith(
      { ...card.providerAccountDetails, cardId: newCardId },
      cvv,
      dateOfBirth,
    )
    expect(result).toEqual({
      valid: true,
      card: {
        balance: debitCardBalance,
        currency: 'EUR',
        status: DebitCardStatus.lost,
      },
    })
  })

  it('should throw error when debit card is not existing', async () => {
    jest.spyOn(cardRepository, 'getDebitCardForAccount').mockImplementation(() => Promise.resolve(null))

    await expect(cardNumberValidator.validateLastFourDigits(accountId, '6789', cvv, dateOfBirth)).rejects.toThrow(
      `Unable to find a card with accountId: ${accountId}`,
    )
  })
})
