import { ContisEndpointPath, ContisClient } from '../../../contis-integration'
import {
  viewPinResponse,
  getSpecificConsumerResponse,
  listCardsResponse,
  validateLastFourDigitsResponse,
} from '../../__tests__/stubbed-responses.data'
import { ListCardsRequest } from '../requests/ListCardsRequest'
import { ValidateLastFourDigitsRequest } from '../requests/ValidateLastFourDigitsRequest'
import { ContisQueryHandler } from '../ContisQueryHandler'
import { ContisAccountDetails } from '../../../../models'
import { NORMAL_CARD_STATE } from '../responses/ListCardsResponse'

const contisAccountDetails = {
  consumerId: 12,
  accountId: 123,
  cardId: 1111,
} as ContisAccountDetails

const cvv = '123'
const dob = '1960-05-24'
const encryptionKey = 'e9de8858a76c406eb2cdde4a33f6e1b286ee3efccfb94506a7dfcfd04e9720bc46634d7679db40b1afa94cfe2d2f2018'
const lastFourDigits = '6789'

describe('ContisQueryHandler', () => {
  let contisQueryHandler: ContisQueryHandler

  const contisClient = {
    sendRequest: jest.fn(),
    generateReferenceId: jest.fn(),
    getEncryptionKey: jest.fn(),
  }

  const encryptionService = {
    decrypt: jest.fn(),
  }

  const errorCode = 500

  beforeEach(async () => {
    contisQueryHandler = new ContisQueryHandler(contisClient as any, encryptionService as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve pin with provided cardId successfully', async () => {
    await jest
      .spyOn(contisClient, 'sendRequest')
      .mockImplementation(() => Promise.resolve({ responseBody: viewPinResponse }))

    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => 'referenceId')

    await jest.spyOn(contisClient, 'getEncryptionKey').mockImplementation(() => encryptionKey)

    await contisQueryHandler.getPin(contisAccountDetails, cvv, dob)

    expect(encryptionService.decrypt).toHaveBeenCalledWith(viewPinResponse.EncryptedPin, encryptionKey)
  })

  it('should throw error while contis viewPin is not successful ', async () => {
    await jest.spyOn(contisClient, 'sendRequest').mockImplementationOnce(() => Promise.resolve({ errorCode }))

    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => 'referenceId')

    await jest.spyOn(contisClient, 'getEncryptionKey').mockImplementation(() => encryptionKey)

    await expect(contisQueryHandler.getPin(contisAccountDetails, cvv, dob)).rejects.toThrow(
      `Unable to get Contis debit card pin. Error: ${errorCode}`,
    )
  })

  it('should update provider details when cardId is not persisted', async () => {
    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => 'referenceId')

    await jest
      .spyOn(contisClient, 'sendRequest')
      .mockImplementationOnce(() => Promise.resolve({ responseBody: listCardsResponse }))

    await contisQueryHandler.getPin(
      {
        ...contisAccountDetails,
        cardId: undefined,
      } as ContisAccountDetails,
      cvv,
      dob,
    )
    verifyListCardsEndpointCalled(contisClient)
  })

  it('should validate card number successfully', async () => {
    await jest
      .spyOn(contisClient, 'sendRequest')
      .mockImplementationOnce(() => Promise.resolve({ responseBody: validateLastFourDigitsResponse }))

    await contisQueryHandler.validateLastFourDigits(contisAccountDetails, lastFourDigits)

    verifyValidateLastFourDigitsEndpointCalled(contisClient)
  })

  it('should NOT validate card number if consumer is not retrieved', async () => {
    await jest.spyOn(contisClient, 'sendRequest').mockImplementationOnce(() => Promise.resolve({ errorCode }))

    await expect(contisQueryHandler.validateLastFourDigits(contisAccountDetails, lastFourDigits)).rejects.toThrow(
      `Unable to validate card for account with consumerId: ${contisAccountDetails.consumerId} Error: ${errorCode}`,
    )
  })

  it('should NOT validate card number if last 4 digits are invalid', async () => {
    await jest.spyOn(contisClient, 'sendRequest').mockImplementationOnce(() => Promise.resolve({ errorCode }))

    await expect(contisQueryHandler.validateLastFourDigits(contisAccountDetails, lastFourDigits)).rejects.toThrow(
      `Unable to validate card for account with consumerId: ${contisAccountDetails.consumerId} Error: ${errorCode}`,
    )
  })

  it('should retrieve card details successfully', async () => {
    const cardDetailsResponse = {
      CardID: '12345',
      ConsumerID: '12',
      ObscuredCardNumber: '4745-****-****-6789',
      CardStatus: NORMAL_CARD_STATE,
    }

    await jest.spyOn(contisClient, 'generateReferenceId').mockImplementation(() => 'referenceId')

    await jest
      .spyOn(contisClient, 'sendRequest')
      .mockImplementationOnce(() => Promise.resolve({ responseBody: listCardsResponse }))

    const details = await contisQueryHandler.getActiveCardDetails(contisAccountDetails)
    verifyListCardsEndpointCalled(contisClient)

    expect(details).toStrictEqual(cardDetailsResponse)
  })

  it('should throw error if retrieving cards is not successful', async () => {
    await jest.spyOn(contisClient, 'sendRequest').mockImplementationOnce(() => Promise.resolve({ errorCode }))

    await expect(contisQueryHandler.getActiveCardDetails(contisAccountDetails)).rejects.toThrow(
      `Unable to retrieve the cards for account with accountId: ${contisAccountDetails.accountId} Error: ${errorCode}`,
    )
  })
})

const verifyListCardsEndpointCalled = (contisClient: ContisClient) => {
  expect(contisClient.sendRequest).toHaveBeenCalledWith(
    ContisEndpointPath.listCards,
    new ListCardsRequest(getSpecificConsumerResponse.AccountIdentifier, 'referenceId'),
    expect.any(Function),
  )
}

const verifyValidateLastFourDigitsEndpointCalled = (contisClient: ContisClient) => {
  expect(contisClient.sendRequest).toHaveBeenCalledWith(
    ContisEndpointPath.validateLastFourDigits,
    new ValidateLastFourDigitsRequest(lastFourDigits, contisAccountDetails.accountId, 'referenceId'),
    expect.any(Function),
  )
}
