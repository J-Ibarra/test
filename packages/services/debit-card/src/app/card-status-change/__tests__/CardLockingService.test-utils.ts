import { CurrencyCode, DebitCardProvider, ContisAccountDetails } from '../../../shared-components/models'

export const cardRepository = {
  getDebitCardForAccount: jest.fn(),
  updateCardStatus: jest.fn(),
}

export const transactionManager = {} as any

export const entityManager = {
  transaction: transactionCallback => transactionCallback(transactionManager),
} as any

export const cardProviderFacadeFactory = {
  getCardProvider: jest.fn(),
}

export const mockedCardProviderFacade = {
  lockCard: jest.fn(),
  getProvider: jest.fn(),
}

export const accountDetails = {
  accountId: 12,
  consumerId: 1,
} as ContisAccountDetails

export const mockedDebitCard = {
  id: '3',
  currency: CurrencyCode.EUR,
  provider: DebitCardProvider.contis,
  providerAccountDetails: accountDetails,
}

export const accountId = '1'
