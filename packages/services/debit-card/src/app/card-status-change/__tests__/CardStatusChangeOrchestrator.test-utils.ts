import { CurrencyCode, DebitCardProvider, ContisAccountDetails } from '../../../shared-components/models'

export const cardRepository = {
  getDebitCardForAccount: jest.fn(),
  updateCardStatus: jest.fn(),
  updateCardWhereProviderDetailsMatch: jest.fn(),
  getAllForStatuses: jest.fn(),
} as any

export const cardReplacementRequestRepository = {
  createCardReplacementRequest: jest.fn(),
}

export const transactionManager = {} as any

export const entityManager = {
  transaction: transactionCallback => transactionCallback(transactionManager),
} as any

export const cardProviderFacadeFactory = {
  getCardProvider: jest.fn(),
} as any

export const mockedCardProviderFacade = {
  setCardAsLostWithReplacement: jest.fn(),
  setCardAsDamaged: jest.fn(),
  getProvider: jest.fn(),
  getActiveCardDetails: jest.fn(),
  suspendAccount: jest.fn(),
  setAccountBackToNormal: jest.fn(),
}

export const accountDetails: ContisAccountDetails = {
  consumerId: 27455,
  accountId: 12,
  cardId: 23812,
  getProviderAccountId: () => 1,
  getCardId: () => 1,
}

export const mockedDebitCard = {
  id: '3',
  currency: CurrencyCode.EUR,
  provider: DebitCardProvider.contis,
  providerAccountDetails: accountDetails,
}

export const accountId = '1'
