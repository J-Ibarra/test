import { UserStatus, CompleteAccountDetails, ContisAccountDetails, Gender } from '../../../models'
import { NORMAL_CARD_STATE } from '../contis/responses/ListCardsResponse'

export const testUserEmail = 'james.williams@foo.bar'

export const getUserDetails = (status: UserStatus): CompleteAccountDetails => {
  return {
    id: 'exchangeAccountId',
    firstName: 'james',
    lastName: 'williams',
    gender: Gender.male,
    dateOfBirth: '1960-05-24',
    email: testUserEmail,
    status,
    nationality: 'GB',
  }
}

export const getContisAccountDetails = (): ContisAccountDetails => {
  return {
    consumerId: 12,
    accountId: 123,
  } as ContisAccountDetails
}

export const consumerPersonalResult = {
  ConsumerID: 12,
  AccountIdentifier: 123,
  FirstName: 'james',
  LastName: 'williams',
}

export const addConsumersResponse = {
  Status: 1,
  ConsumerPersonalResList: [consumerPersonalResult],
  AccountIdentifier: 123,
  AccountNumber: 'AccountNumber',
  SortCode: 'SortCode',
  IBAN: 'IBAN',
  BIC: 'BIC',
  Description: 'addConsumersResponse',
  ResponseCode: '000',
  ClientRequestReference: 'addConsumersReference',
}

export const loadConsumerAccountResponse = {
  TransactionReferenceID: 1234,
  Description: 'loadConsumerAccountResponse',
  ResponseCode: '000',
  ClientRequestReference: 'loadConsumerAccountReference',
}

export const unloadConsumerAccountResponse = {
  TransactionReferenceID: 1235,
  Description: 'unloadConsumerAccountResponse',
  ResponseCode: '000',
  ClientRequestReference: 'unloadConsumerAccountReference',
}

export const listAccountsResponse = {
  AccountResList: [
    {
      AccountIdentifier: 123,
      SortCode: 'SortCode',
      IBAN: 'IBAN',
      BIC: 'BIC',
    },
  ],
}

export const viewPinResponse = {
  EncryptedPin: 'THdxXXAiz/ds57CAOtnQUg==',
  Description: 'viewPinResponse',
  ResponseCode: '000',
  ClientRequestReference: 'referenceId',
}

export const getSpecificConsumerResponse = {
  ConsumerID: '12',
  Status: 1,
  ConsumerRes: null,
  AccountIdentifier: 123,
  AccountNumber: 'AccountNumber',
  SortCode: 'SortCode',
  IBAN: 'IBAN',
  BIC: 'BIC',
  Description: 'getSpecificConsumerResponse',
  ResponseCode: '000',
  ClientRequestReference: 'referenceId',
}

export const listCardsResponse = {
  CardResList: [
    {
      CardID: '12345',
      ConsumerID: '12',
      ObscuredCardNumber: '4745-****-****-6789',
      CardStatus: NORMAL_CARD_STATE,
    },
  ],
  Description: 'addConsumersResponse',
  ResponseCode: '000',
  ClientRequestReference: 'referenceId',
}

export const validateLastFourDigitsResponse = {
  Description: 'Success',
  ResponseCode: '000',
  ClientRequestReference: 'referenceId',
}
