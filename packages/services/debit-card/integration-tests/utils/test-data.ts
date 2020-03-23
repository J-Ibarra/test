import moment from 'moment'

import { AccountType, User } from '@abx/ke-auth-lib'
import {
  CompleteAccountDetails,
  UserStatus,
  Gender,
  CurrencyCode,
  DebitCard,
  DebitCardProvider,
  DebitCardStatus,
  ContisAccountDetails,
  KinesisCryptoCurrency,
  TopUpRequestStatus,
  TransactionType,
  Address,
} from '../../src/shared-components/models'
import { ContisEndpointPath } from '../../src/shared-components/providers'
/* tslint:disable-next-line:max-line-length */
import { NORMAL_CARD_STATE } from '../../src/shared-components/providers/debit-card-provider/contis/responses/ListCardsResponse'

export const orderId = 463728
export const cardCurrency: CurrencyCode = CurrencyCode.EUR
export const presentAddress: Address = {
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  postCode: '1000',
  country: 'United Kingdom',
}

export const defaultCompleteAccountDetails: CompleteAccountDetails = {
  id: '12',
  email: 'james.williams@foo.bar',
  nationality: 'UK',
  firstName: 'james',
  lastName: 'williams',
  gender: Gender.male,
  dateOfBirth: '1960-05-24',
  status: UserStatus.kycVerified,
}

export const notKycVerifiedCompleteAccountDetails: CompleteAccountDetails = {
  id: '12',
  email: 'james.williams@foo.bar',
  nationality: 'UK',
  firstName: 'james',
  lastName: 'williams',
  gender: Gender.male,
  dateOfBirth: '1960-05-24',
  status: UserStatus.registered,
}

export const cardDetails: Partial<DebitCard> = {
  accountId: 'accountId',
  provider: DebitCardProvider.contis,
  providerAccountDetails: {
    consumerId: 1,
    accountId: 21,
  } as ContisAccountDetails,
  currency: CurrencyCode.EUR,
  status: DebitCardStatus.active,
  balance: 0,
  transactions: [],
}

export const adminTestUser: User = {
  id: '13',
  accountType: AccountType.admin,
  accountId: '13',
  firstName: 'Foo',
  lastName: 'Bar',
  email: 'fat.joe@foo.bar',
}

export const defaultTestUser: User = {
  id: '12',
  accountType: AccountType.individual,
  accountId: '12',
  firstName: 'James',
  lastName: 'Williams',
  email: 'james.williams@foo.bar',
}

export const testContisAccountIdentifier = 123
export const testContisConsumerId = 17

export const kycStatusChangeChannel = 'exchange:account:kycStatusChange'

export const testCardDetails = {
  CardID: 123456,
  ConsumerID: testContisConsumerId,
  ObscuredCardNumber: '4745-****-****-6789',
  CardDisplayName: 'Foo Bar',
  CardStatus: NORMAL_CARD_STATE,
}

export const defaultContisStubbedEndpoints = new Map([
  [ContisEndpointPath.logIn, {}],
  [
    ContisEndpointPath.addConsumers,
    {
      ConsumerPersonalResList: [{ ConsumerID: testContisConsumerId }],
      AccountIdentifier: testContisAccountIdentifier,
    },
  ],
  [
    ContisEndpointPath.listAccounts,
    {
      AccountResList: [{}],
    },
  ],
  [
    ContisEndpointPath.viewPin,
    {
      EncryptedPin: 'nHplT3PngLM8eBoElM41/A==',
    },
  ],
  [
    ContisEndpointPath.getSpecificConsumer,
    {
      ConsumerID: testContisConsumerId,
      Status: 1,
      AccountIdentifier: testContisAccountIdentifier,
      AccountNumber: 'AccountNumber',
      SortCode: 'SortCode',
      IBAN: 'IBAN',
      BIC: 'BIC',
    },
  ],
  [
    ContisEndpointPath.listCards,
    {
      CardResList: [testCardDetails],
    },
  ],
  [ContisEndpointPath.setConsumerAsLockout, {}],
  [
    ContisEndpointPath.validateLastFourDigits,
    {
      Description: 'Success',
    },
  ],
  [
    ContisEndpointPath.setCardAsLostWithReplacement,
    {
      Description: 'Success',
    },
  ],
  [
    ContisEndpointPath.setCardAsDamaged,
    {
      Description: 'Success',
    },
  ],
  [
    ContisEndpointPath.unloadConsumerAccount,
    {
      Description: 'Success',
      TransactionReferenceID: 1,
    },
  ],
  [
    ContisEndpointPath.loadConsumerAccount,
    {
      Description: 'Success',
      TransactionReferenceID: 1,
    },
  ],
  [
    ContisEndpointPath.validateLastFourDigits,
    {
      Description: 'Success',
    },
  ],
])

export const createTopUpRequests = (testDebitCard: DebitCard) => [
  {
    id: 3,
    debitCard: testDebitCard,
    orderId: 3,
    soldCurrencyAmount: 10,
    soldCurrency: KinesisCryptoCurrency.kag,
    status: TopUpRequestStatus.orderPlaced,
    amountToTopUp: 10,
    amountFilled: 9,
    createdAt: moment()
      .add(1, 'hours')
      .toDate(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    debitCard: testDebitCard,
    orderId: 4,
    soldCurrencyAmount: 12,
    soldCurrency: KinesisCryptoCurrency.kag,
    status: TopUpRequestStatus.complete,
    amountToTopUp: 100,
    amountFilled: 12,
    createdAt: moment()
      .subtract(2, 'hours')
      .toDate(),
    updatedAt: new Date(),
  },
]

export const createTransactions = (testDebitCard: DebitCard) => [
  {
    id: 2,
    debitCard: testDebitCard,
    amount: 10,
    type: TransactionType.incoming,
    description: 'Foo ABC',
    providerTransactionIdentifier: 10,
    createdAt: moment().toDate(),
    updatedAt: new Date(),
  },
  {
    id: 1,
    debitCard: testDebitCard,
    amount: 12,
    type: TransactionType.outgoing,
    description: 'Bar ABC',
    providerTransactionIdentifier: 12,
    createdAt: moment()
      .subtract(1, 'hours')
      .toDate(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    debitCard: testDebitCard,
    amount: 12,
    type: TransactionType.outgoing,
    description: 'Bar ABC',
    providerTransactionIdentifier: 8,
    createdAt: moment()
      .subtract(2, 'hours')
      .toDate(),
    updatedAt: new Date(),
  },
]
