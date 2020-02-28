import { CurrencyCode, DebitCardProvider } from '../../../models'

export const cardRepository = {
  getDebitCardForAccount: jest.fn(),
} as any

export const transactionRepository = {
  getAllForCard: jest.fn(),
  insert: jest.fn(),
} as any

export const topUpRequestRepository = {
  getAllTopUpRequestsForDebitCard: jest.fn(),
  findByIds: jest.fn(),
} as any

export const cardProviderFacade = {
  getTransactions: jest.fn(),
}

export const cardProviderFacadeFactory = {
  getCardProvider: () => cardProviderFacade,
} as any

export const accountId = '1'

export const testDebitCard = {
  id: 3,
  currency: CurrencyCode.EUR,
  provider: DebitCardProvider.contis,
  providerAccountDetails: {},
  accountId,
  getProviderAccountId: () => 1,
} as any
