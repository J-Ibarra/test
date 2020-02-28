import { CompleteAccountDetails, UserStatus, CurrencyCode, Gender, Address } from '../../../shared-components/models'

export const transactionManager = {} as any

export const cardProviderFacadeFactory = {
  getCardProvider: jest.fn(),
}

export const cardOrderRequestRepository = {
  updateOrderRequestStatus: jest.fn(),
}

export const cardRepository = {
  createNewCard: jest.fn(),
}

export const entityManager = {
  transaction: transactionCallback => transactionCallback(transactionManager),
}

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
export const initialDeposit = 100
export const cardCurrency = CurrencyCode.EUR
export const presentAddress: Address = {
  addressLine1: '',
  addressLine2: '',
  addressLine3: 'County',
  postCode: '1000',
  country: 'United Kingdom',
}

export const mockedCardProviderFacade = {
  createAccount: jest.fn(),
  getProvider: jest.fn(),
}
export const mockedProviderAccount = { foo: 'bar' }
export const mockedProvider = { bar: 'foo' }
export const mockedDebitCard = { foo: 'foo' }
export const mockedBalance = { bar: 'bar' }
export const mockedUpdateStatus = { foo: 'test' }
export const mockedBalanceResponse = Promise.resolve(mockedBalance)
export const mockedUpdateOrderRequestStatusResponse = Promise.resolve(mockedUpdateStatus)

export const mockContisConfig = {
  cardOrderFee: 100,
}

export const configSource = {
  getExchangeDbConfig: jest.fn(),
  getDebitCardDbConfig: jest.fn(),
  getUserInterfaceDomain: jest.fn(),
  getLogLevel: jest.fn(),
  getContisConfig: () => mockContisConfig,
  getCookieCryptoParams: jest.fn(),
  getJwtConfig: jest.fn(),
  getRedisConfig: jest.fn(),
}
