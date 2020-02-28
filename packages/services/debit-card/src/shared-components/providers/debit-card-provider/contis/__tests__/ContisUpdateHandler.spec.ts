import { ProviderAccountDetails, UserStatus, CompleteAccountDetails } from '../../../../models'
import { ContisEndpointPath, ContisClient } from '../../../contis-integration'
import {
  addConsumersResponse,
  loadConsumerAccountResponse,
  unloadConsumerAccountResponse,
  consumerPersonalResult,
  getUserDetails,
  listAccountsResponse,
  getContisAccountDetails,
} from '../../__tests__/stubbed-responses.data'
import { AddConsumersRequest } from '../requests/AddConsumersRequest'
import { LoadConsumerAccountRequest } from '../requests/LoadConsumerAccountRequest'
import { ContisUpdateHandler, TOP_UP_REQUEST_CLIENT_REFERENCE_PREFIX } from '../ContisUpdateHandler'
import { UnloadConsumerAccountRequest } from '../requests/UnloadConsumerAccountRequest'

const referenceId = 'ABCD-1234'
const amount = 200
const presentAddress = {
  addressLine1: 'Flat 61',
  addressLine2: '120 Melbourne street',
  addressLine3: 'Brisbane',
  postCode: '1000',
  country: 'Australia',
}

const sync = fn =>
  fn
    .then(res => () => res)
    .catch(err => () => {
      throw err
    })

describe('ContisUpdateHandler', () => {
  let contisUpdateHandler: ContisUpdateHandler

  const contisClient = {
    sendRequest: jest.fn(),
    generateReferenceId: jest.fn(),
  }

  const errorCode = 500

  beforeEach(async () => {
    contisUpdateHandler = new ContisUpdateHandler(contisClient as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create account and load funds successfully', async () => {
    await jest
      .spyOn(contisClient, 'sendRequest')
      .mockImplementationOnce(() => Promise.resolve({ responseBody: addConsumersResponse }))

    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => referenceId)

    const response: ProviderAccountDetails = await contisUpdateHandler.createAccount(
      getUserDetails(UserStatus.kycVerified),
      presentAddress,
    )
    await expect(response).toEqual({
      consumerId: consumerPersonalResult.ConsumerID,
      accountId: consumerPersonalResult.AccountIdentifier,
    })
    verifyAddConsumerEndpointCalled(contisClient)
  })

  it('should throw error while creating an account', async () => {
    await jest.spyOn(contisClient, 'sendRequest').mockImplementationOnce(() => Promise.resolve({ errorCode }))

    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => 'referenceId')

    await expect(contisUpdateHandler.createAccount(getUserDetails(UserStatus.kycVerified), presentAddress)).rejects.toThrow(
      `Unable to create Contis Consumer account. Error: ${errorCode}`,
    )
  })

  it('should load balance to an existing account successfully', async () => {
    await jest
      .spyOn(contisClient, 'sendRequest')
      .mockImplementationOnce(() => Promise.resolve({ responseBody: loadConsumerAccountResponse }))

    const topUpRequestId = 1

    expect(await sync(contisUpdateHandler.loadBalance(topUpRequestId, getContisAccountDetails(), amount))).not.toThrow()

    expect(contisClient.sendRequest).toHaveBeenCalledWith(
      ContisEndpointPath.loadConsumerAccount,
      new LoadConsumerAccountRequest(
        amount * 100,
        listAccountsResponse.AccountResList[0].AccountIdentifier,
        `${TOP_UP_REQUEST_CLIENT_REFERENCE_PREFIX}${topUpRequestId}`,
      ),
      expect.any(Function),
    )
  })

  it('should throw error while loading the consumer\'s account', async () => {
    await jest.spyOn(contisClient, 'sendRequest').mockImplementationOnce(() => Promise.resolve({ errorCode }))

    const topUpRequestId = 1

    await expect(contisUpdateHandler.loadBalance(topUpRequestId, getContisAccountDetails(), amount)).rejects.toThrow(
      /* tslint:disable-next-line */
      `Unable to load Contis Consumer account ${listAccountsResponse.AccountResList[0].AccountIdentifier}. Error: ${errorCode}`,
    )
  })

  it('should unload balance to an existing account successfully', async () => {
    await jest
      .spyOn(contisClient, 'sendRequest')
      .mockImplementationOnce(() => Promise.resolve({ responseBody: unloadConsumerAccountResponse }))

    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => referenceId)

    expect(await sync(contisUpdateHandler.unloadBalance(getContisAccountDetails(), amount))).not.toThrow()

    expect(contisClient.sendRequest).toHaveBeenCalledWith(
      ContisEndpointPath.unloadConsumerAccount,
      new UnloadConsumerAccountRequest(amount * 100, listAccountsResponse.AccountResList[0].AccountIdentifier, referenceId),
      expect.any(Function),
    )
  })

  it('should throw error while unloading the consumer\'s account', async () => {
    await jest.spyOn(contisClient, 'sendRequest').mockImplementationOnce(() => Promise.resolve({ errorCode }))

    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => 'referenceId')

    await expect(contisUpdateHandler.unloadBalance(getContisAccountDetails(), amount)).rejects.toThrow(
      /* tslint:disable-next-line */
      `Unable to unload Contis Consumer account ${listAccountsResponse.AccountResList[0].AccountIdentifier}. Error: ${errorCode}`,
    )
  })
})

const verifyAddConsumerEndpointCalled = (contisClient: ContisClient) => {
  const accountDetails: CompleteAccountDetails = getUserDetails(UserStatus.kycVerified)

  expect(contisClient.sendRequest).toHaveBeenNthCalledWith(
    1,
    ContisEndpointPath.addConsumers,
    new AddConsumersRequest(
      [
        {
          FirstName: accountDetails.firstName,
          LastName: accountDetails.lastName,
          Gender: accountDetails.gender,
          DOB: accountDetails.dateOfBirth,
          Relationship: 1,
          PresentAddress: {
            ...presentAddress,
            Town: presentAddress.addressLine3,
            ISOCountryCode: '036',
          },
          IsPrimaryConsumer: true,
        },
      ],
      referenceId,
    ),
    expect.any(Function),
  )
}
