import {
  CompleteAccountDetails,
  UserStatus,
  CurrencyCode,
  DebitCardProvider,
  Gender,
  TopUpRequestStatus,
} from '../../../shared-components/models'

export const cardRepository = {
  getDebitCardForAccount: jest.fn(),
  getDebitCardForAccountWithPessimisticLock: jest.fn(),
}

export const topUpRequestRepository = {
  createTopUpRequest: jest.fn(),
  getTopUpRequest: jest.fn(),
  updateTopUpRequest: jest.fn(),
}

export const placeOrderFacade = {
  createSellMarketOrder: jest.fn(),
}

export const balanceReserveFacade = {
  reserveTopUpBalance: jest.fn(),
  confirmTopUpBalance: jest.fn(),
}

export const cardProviderFacadeFactory = {
  getCardProvider: jest.fn(),
}

export const cardConstraintService = {
  getCardConstraintValue: jest.fn(),
}

export const cardProviderFacade = {
  loadBalance: jest.fn(),
  getProvider: jest.fn(),
}

export const transactionManager = {} as any

export const entityManager = {
  transaction: transactionCallback => transactionCallback(transactionManager),
} as any

export const accountDetails: CompleteAccountDetails = {
  id: '1',
  nationality: 'UK',
  firstName: 'james',
  lastName: 'williams',
  gender: Gender.male,
  dateOfBirth: '1960-05-24',
  email: 'james.williams@foo.bar',
  status: UserStatus.registered,
}

export const amount = 100
export const accountId = '1'
export const orderId = 123

export const mockedDebitCard = {
  id: '3',
  currency: CurrencyCode.EUR,
  provider: DebitCardProvider.contis,
  providerAccountDetails: accountDetails,
  accountId,
} as any

export const mockedTopUpRequest = {
  id: 17,
  status: TopUpRequestStatus.complete,
}

export const notCompletedTopUpRequest = {
  id: 1,
  status: TopUpRequestStatus.orderPlaced,
}
