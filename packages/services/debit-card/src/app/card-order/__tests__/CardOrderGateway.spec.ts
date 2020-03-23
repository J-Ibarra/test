import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { CardOrderGateway } from '../CardOrderGateway'
import {
  CardOrderRequest,
  CurrencyCode,
  CardOrderRequestStatus,
  UserStatus,
  CompleteAccountDetails,
  Gender,
} from '../../../shared-components/models'
import { USER_DETAILS_FACADE_TOKEN } from '../../../shared-components/providers'
import * as OrchestratorTestUtils from './CardOrderOrchestrator.test-utils'

const accountId = '123'
const cardCurrency = CurrencyCode.GBP

const cardOrderRequest: CardOrderRequest = {
  id: 1,
  accountId,
  currency: cardCurrency,
  status: CardOrderRequestStatus.orderPending,
  presentAddress: OrchestratorTestUtils.presentAddress,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const cardOrderRequestRepository = {
  saveCardOrderRequest: jest.fn(),
  updateOrderRequestStatus: jest.fn(),
  getLatestOrderRequestForAccount: jest.fn(),
}

const exchangeUserDetailsFacade = {
  getFullAccountDetails: jest.fn(),
}

const getUserDetails = (status: UserStatus): CompleteAccountDetails => {
  return {
    id: '1',
    firstName: 'james',
    lastName: 'williams',
    gender: Gender.male,
    dateOfBirth: '1960-05-24',
    email: 'james.williams@foo.bar',
    status,
    nationality: 'UK',
  }
}

const cardOrderOrchestrator = {
  orderDebitCardForUser: jest.fn(),
}

describe('CardOrderGateway', () => {
  let cardOrderGateway: CardOrderGateway

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CardOrderGateway,
        {
          provide: getRepositoryToken(CardOrderRequest),
          useValue: cardOrderRequestRepository,
        },
        {
          provide: USER_DETAILS_FACADE_TOKEN,
          useValue: exchangeUserDetailsFacade,
        },
        {
          provide: 'CardOrderOrchestrator',
          useValue: cardOrderOrchestrator,
        },
      ],
    }).compile()

    cardOrderGateway = module.get<CardOrderGateway>(CardOrderGateway)
  })

  it('should throw an error when there is existing request for the same account', async () => {
    jest
      .spyOn(cardOrderRequestRepository, 'getLatestOrderRequestForAccount')
      .mockImplementation(() => Promise.resolve(cardOrderRequest))

    await expect(cardOrderGateway.orderDebitCard(accountId, cardCurrency, OrchestratorTestUtils.presentAddress)).rejects.toThrow(
      new Error('The order request has been already made'),
    )
  })

  it('should save order request for non verified user', async () => {
    jest.spyOn(cardOrderRequestRepository, 'getLatestOrderRequestForAccount').mockImplementation(() => Promise.resolve())

    jest
      .spyOn(exchangeUserDetailsFacade, 'getFullAccountDetails')
      .mockImplementation(() => Promise.resolve(getUserDetails(UserStatus.registered)))

    await cardOrderGateway.orderDebitCard(accountId, cardCurrency, OrchestratorTestUtils.presentAddress)
    await expect(cardOrderRequestRepository.saveCardOrderRequest).toHaveBeenCalledWith(
      accountId,
      cardCurrency,
      CardOrderRequestStatus.kycPending,
      OrchestratorTestUtils.presentAddress,
    )
  })

  it('should save order request for kyc verified user', async () => {
    jest.spyOn(cardOrderRequestRepository, 'getLatestOrderRequestForAccount').mockImplementation(() => Promise.resolve())

    jest
      .spyOn(exchangeUserDetailsFacade, 'getFullAccountDetails')
      .mockImplementation(() => Promise.resolve(getUserDetails(UserStatus.kycVerified)))

    await cardOrderGateway.orderDebitCard(accountId, cardCurrency, OrchestratorTestUtils.presentAddress)
    await expect(cardOrderRequestRepository.saveCardOrderRequest).toHaveBeenCalledWith(
      accountId,
      cardCurrency,
      CardOrderRequestStatus.orderPending,
      OrchestratorTestUtils.presentAddress,
    )
  })

  it('should order debit card for user', async () => {
    const details = getUserDetails(UserStatus.kycVerified)
    jest.spyOn(cardOrderRequestRepository, 'getLatestOrderRequestForAccount').mockImplementation(() => Promise.resolve())

    jest.spyOn(exchangeUserDetailsFacade, 'getFullAccountDetails').mockImplementation(() => Promise.resolve(details))

    await cardOrderGateway.orderDebitCard(accountId, cardCurrency, OrchestratorTestUtils.presentAddress)
    await expect(cardOrderOrchestrator.orderDebitCardForUser).toHaveBeenCalledWith(
      details,
      cardCurrency,
      OrchestratorTestUtils.presentAddress,
    )
  })
})
