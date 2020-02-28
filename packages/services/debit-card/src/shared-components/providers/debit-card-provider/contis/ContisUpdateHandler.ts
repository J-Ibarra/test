import { Logger } from '@nestjs/common'
import { DefaultContisClient, ContisEndpointPath, ContisResponse } from '../../contis-integration'
import { CompleteAccountDetails, ProviderAccountDetails, ContisAccountDetails, Address } from '../../../models'
import { ConsumerPersonalReq, AddConsumersRequest, ContisAddressDetails } from './requests/AddConsumersRequest'
import { AddConsumersResponse } from './responses/AddConsumersResponse'
import { ContisRequestPayload } from './requests/ContisRequestPayload'
import { ChangeConsumerStateRequest } from './requests/ChangeConsumerStateRequest'
import { LoadConsumerAccountResponse } from './responses/LoadConsumerAccountResponse'
import { LoadConsumerAccountRequest } from './requests/LoadConsumerAccountRequest'
import { ChangeCardStateRequest } from './requests/ChangeCardStateRequest'
import { GenericContisResponse } from './responses/GenericContisResponse'
import { UnloadConsumerAccountRequest } from './requests/UnloadConsumerAccountRequest'
import { UnloadConsumerAccountResponse } from './responses/UnloadConsumerAccountResponse'
import { ActivateCardRequest } from './requests/ActivateCardRequest'

export const TOP_UP_REQUEST_CLIENT_REFERENCE_PREFIX = 'kinesis-topup-request-'

export class ContisUpdateHandler {
  private readonly logger = new Logger('ContisUpdateHandler')
  private readonly centsInOneCurrency = 100

  constructor(private contisClient: DefaultContisClient) {}

  public async loadBalance(
    topUpRequestId: number,
    accountDetails: ContisAccountDetails,
    amount: number,
  ): Promise<{ transactionId: number }> {
    const transactionId = await this.loadConsumerAccount(
      amount * this.centsInOneCurrency,
      { AccountIdentifier: accountDetails.accountId },
      `${TOP_UP_REQUEST_CLIENT_REFERENCE_PREFIX}${topUpRequestId}`,
    )

    return { transactionId }
  }

  public async unloadBalance(accountDetails: ContisAccountDetails, amount: number): Promise<number> {
    const requestReferenceId = this.contisClient.generateReferenceId()

    return await this.unloadConsumerAccount(
      amount * this.centsInOneCurrency,
      { AccountIdentifier: accountDetails.accountId },
      requestReferenceId,
    )
  }

  public async createAccount(accountDetails: CompleteAccountDetails, presentAddress: Address): Promise<ProviderAccountDetails> {
    const requestReferenceId = this.contisClient.generateReferenceId()
    const addConsumersResponse = await this.createConsumer(accountDetails, presentAddress, requestReferenceId)

    return {
      consumerId: addConsumersResponse.ConsumerPersonalResList[0].ConsumerID,
      accountId: addConsumersResponse.AccountIdentifier,
    } as ContisAccountDetails
  }

  public async activateCard({ cardId, accountId }: ContisAccountDetails, cvv: string, dateOfBirth: string): Promise<void> {
    const referenceId: string = this.contisClient.generateReferenceId()

    const transactionResponse: ContisResponse<GenericContisResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.activateCard,
      new ActivateCardRequest(cardId!, dateOfBirth, cvv, referenceId),
      transactionsResponse => new GenericContisResponse(transactionsResponse),
    )

    if (!!transactionResponse.errorCode) {
      this.logger.error(`Activating card ${cardId} for contis account ${accountId} failed`)

      throw Error(`Unable to activate card for account with accountId: ${accountId}`)
    }
  }

  public async lockCard(cardId: number, consumerId: number): Promise<GenericContisResponse> {
    const referenceId: string = this.contisClient.generateReferenceId()
    const changeConsumerStateResponse: ContisResponse<GenericContisResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.setCardAsBlock,
      new ChangeCardStateRequest(cardId, consumerId, referenceId),
      encryptedResponse => new GenericContisResponse(encryptedResponse),
    )

    if (!!changeConsumerStateResponse.errorCode) {
      throw Error(`Unable to lock card ${cardId} for consumer ${consumerId}. Error: ${changeConsumerStateResponse.errorCode}`)
    }

    return changeConsumerStateResponse.responseBody!
  }

  public async setCardAsNormal(cardId: number, consumerId: number): Promise<GenericContisResponse> {
    const referenceId: string = this.contisClient.generateReferenceId()
    const setConsumerStateResponse: ContisResponse<GenericContisResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.setCardAsNormal,
      new ChangeCardStateRequest(cardId, consumerId, referenceId),
      encryptedResponse => new GenericContisResponse(encryptedResponse),
    )

    if (!!setConsumerStateResponse.errorCode) {
      throw Error(
        `Unable to setting card state to normal for consumer
        ${consumerId} and card ${cardId}. Error: ${setConsumerStateResponse.errorCode}`,
      )
    }

    return setConsumerStateResponse.responseBody!
  }

  public async setCardAsLostWithReplacement(cardId: number, consumerId: number): Promise<GenericContisResponse> {
    const referenceId: string = this.contisClient.generateReferenceId()
    const contisSetCardAsLostWithReplacementResponse: ContisResponse<GenericContisResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.setCardAsLostWithReplacement,
      new ChangeCardStateRequest(cardId, consumerId, referenceId),
      encryptedResponse => new GenericContisResponse(encryptedResponse),
    )

    if (!!contisSetCardAsLostWithReplacementResponse.errorCode) {
      throw Error(
        `Unable to mark contis debit card ${cardId} as lost.
        Error: ${contisSetCardAsLostWithReplacementResponse.errorCode}`,
      )
    }
    return contisSetCardAsLostWithReplacementResponse.responseBody!
  }

  public async setCardAsDamaged(cardId: number, consumerId: number): Promise<GenericContisResponse> {
    const referenceId: string = this.contisClient.generateReferenceId()
    const contisSetCardAsDamagedResponse: ContisResponse<GenericContisResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.setCardAsDamaged,
      new ChangeCardStateRequest(cardId, consumerId, referenceId),
      encryptedResponse => new GenericContisResponse(encryptedResponse),
    )

    if (!!contisSetCardAsDamagedResponse.errorCode) {
      throw Error(`Unable to mark contis debit card ${cardId} as damaged. Error: ${contisSetCardAsDamagedResponse.errorCode}`)
    }

    return contisSetCardAsDamagedResponse.responseBody!
  }

  public async suspendConsumer(consumerId: number): Promise<void> {
    const referenceId: string = this.contisClient.generateReferenceId()
    const accountSuspensionResponse: ContisResponse<ChangeConsumerStateRequest> = await this.contisClient.sendRequest(
      ContisEndpointPath.setConsumerAsLockout,
      new ChangeConsumerStateRequest(consumerId, referenceId),
      encryptedResponse => new GenericContisResponse(encryptedResponse),
    )

    if (!!accountSuspensionResponse.errorCode) {
      throw Error(`Unable to suspend consumer ${consumerId}. Error: ${accountSuspensionResponse.errorCode}`)
    }
  }

  public async setConsumerAsNormal(consumerId: number): Promise<GenericContisResponse> {
    const referenceId: string = this.contisClient.generateReferenceId()
    const setConsumerStateResponse: ContisResponse<GenericContisResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.setConsumerAsNormal,
      new ChangeConsumerStateRequest(consumerId, referenceId),
      encryptedResponse => new GenericContisResponse(encryptedResponse),
    )

    if (!!setConsumerStateResponse.errorCode) {
      throw Error(
        `Unable to setting card state to normal for consumer
        ${consumerId}. Error: ${setConsumerStateResponse.errorCode}`,
      )
    }

    return setConsumerStateResponse.responseBody!
  }

  private async loadConsumerAccount(
    amountInCentsPence: number,
    { AccountIdentifier }: { AccountIdentifier: number },
    referenceId: string,
  ): Promise<number> {
    const loadConsumerAccountPayload = new LoadConsumerAccountRequest(amountInCentsPence, AccountIdentifier, referenceId)

    const loadConsumerAccountResponse = await this.contisClient.sendRequest<LoadConsumerAccountResponse>(
      ContisEndpointPath.loadConsumerAccount,
      loadConsumerAccountPayload,
      encryptedResponse => new LoadConsumerAccountResponse(encryptedResponse),
    )

    if (loadConsumerAccountResponse.errorCode) {
      throw Error(`Unable to load Contis Consumer account ${AccountIdentifier}. Error: ${loadConsumerAccountResponse.errorCode}`)
    }

    return loadConsumerAccountResponse.responseBody!.TransactionReferenceID
  }

  private async unloadConsumerAccount(
    amountInCentsPence: number,
    { AccountIdentifier }: { AccountIdentifier: number },
    referenceId: string,
  ): Promise<number> {
    const unloadConsumerAccountPayload = new UnloadConsumerAccountRequest(amountInCentsPence, AccountIdentifier, referenceId)

    const unloadConsumerAccountResponse: ContisResponse<UnloadConsumerAccountResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.unloadConsumerAccount,
      unloadConsumerAccountPayload,
      encryptedResponse => new UnloadConsumerAccountResponse(encryptedResponse),
    )

    if (unloadConsumerAccountResponse.errorCode) {
      throw Error(
        `Unable to unload Contis Consumer account ${AccountIdentifier}. Error: ${unloadConsumerAccountResponse.errorCode}`,
      )
    }

    return unloadConsumerAccountResponse.responseBody!.TransactionReferenceID
  }

  private async createConsumer(
    accountDetails: CompleteAccountDetails,
    presentAddress: Address,
    requestReferenceId: string,
  ): Promise<AddConsumersResponse> {
    const addConsumersResponse: ContisResponse<AddConsumersResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.addConsumers,
      this.mapAccountDetailsToAddConsumersRequest(accountDetails, presentAddress, requestReferenceId),
      encryptedResponse => new AddConsumersResponse(encryptedResponse),
    )

    if (!!addConsumersResponse.errorCode) {
      throw Error(`Unable to create Contis Consumer account. Error: ${addConsumersResponse.errorCode}`)
    }
    return addConsumersResponse.responseBody!
  }

  private mapAccountDetailsToAddConsumersRequest(
    accountDetails: CompleteAccountDetails,
    presentAddress: Address,
    requestReferenceId: string,
  ): ContisRequestPayload {
    const consumer: ConsumerPersonalReq = {
      FirstName: accountDetails.firstName,
      LastName: accountDetails.lastName,
      Gender: accountDetails.gender.charAt(0).toUpperCase(),
      DOB: accountDetails.dateOfBirth,
      Relationship: 1,
      PresentAddress: new ContisAddressDetails(presentAddress),
      IsPrimaryConsumer: true,
    }

    return new AddConsumersRequest([consumer], requestReferenceId)
  }
}
