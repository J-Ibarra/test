import moment from 'moment'
import Decimal from 'decimal.js'
import { Logger } from '@nestjs/common'
import { DefaultContisClient, ContisEndpointPath, ContisResponse, AESEncryptionService } from '../../contis-integration'
import { ContisAccountDetails, CoreTransactionDetails } from '../../../models'
import { ListCardsRequest } from './requests/ListCardsRequest'
import { ListCardsResponse, ContisCardResult, NORMAL_CARD_STATE } from './responses/ListCardsResponse'
import { ViewPinResponse } from './responses/ViewPinResponse'
import { ViewPinRequest } from './requests/ViewPinRequest'
import { ValidateLastFourDigitsRequest } from './requests/ValidateLastFourDigitsRequest'
import { GenericContisResponse } from './responses/GenericContisResponse'
import { ListTransactionResponse } from './responses/ListTransactionsResponse'
import { ListTransactionsRequest } from './requests/ListTransactionsRequest'
import { LastFourDigitValidationResponse } from '../responses'
import { GetAccountBalanceRequest } from './requests/GetAccountBalanceRequest'
import { GetAccountBalanceResponse } from './responses/GetAccountBalanceResponse'

export class ContisQueryHandler {
  private readonly logger = new Logger('ContisQueryHandler')

  constructor(private contisClient: DefaultContisClient, private encryptionService: AESEncryptionService) {}

  public async getPin(details: ContisAccountDetails, cvv: string, dob: string): Promise<string> {
    const referenceId: string = this.contisClient.generateReferenceId()
    let cardId = details.cardId || null

    if (!cardId) {
      const listCardsResponse = await this.listCards(details.accountId, referenceId)
      cardId = listCardsResponse.CardResList.find(({ CardStatus }) => CardStatus === NORMAL_CARD_STATE)!.CardID
    }

    const viewPinResponse = await this.viewPin(cardId, cvv, dob, referenceId)

    return this.encryptionService.decrypt(viewPinResponse.EncryptedPin, this.contisClient.getEncryptionKey())
  }

  public async listCards(
    accountIdentifier: number,
    referenceId: string = this.contisClient.generateReferenceId(),
  ): Promise<ListCardsResponse> {
    const listCardsRequest = new ListCardsRequest(accountIdentifier, referenceId)

    const listCardsResponse: ContisResponse<ListCardsResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.listCards,
      listCardsRequest,
      encryptedListCardsResponse => new ListCardsResponse(encryptedListCardsResponse),
    )

    if (!!listCardsResponse.errorCode) {
      throw Error(
        `Unable to retrieve the cards for account with accountId: ${accountIdentifier} Error: ${listCardsResponse.errorCode}`,
      )
    }
    return listCardsResponse.responseBody!
  }

  public async getTransactions(accountIdentifier: number, from: Date, to: Date): Promise<CoreTransactionDetails[]> {
    const referenceId: string = this.contisClient.generateReferenceId()

    const transactionResponse: ContisResponse<ListTransactionResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.listTransactions,
      new ListTransactionsRequest(from, to, referenceId, accountIdentifier),
      transactionsResponse =>  new ListTransactionResponse(transactionsResponse)
    )

    if (!!transactionResponse.errorCode) {
      this.logger.debug(`Retrieving transactions for contis account ${accountIdentifier} failed`)

      throw Error(`Unable to validate card for account with accountId: ${accountIdentifier}`)
    }

    return transactionResponse.responseBody!.formatRawTransactionsToCoreTransactionDetails()
  }

  public async getAccountBalance(details: ContisAccountDetails): Promise<number> {
    const balanceResponse: ContisResponse<GetAccountBalanceResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.getSpecificAccountBalance,
      new GetAccountBalanceRequest(details.accountId),
      response => new GetAccountBalanceResponse(response),
    )

    if (!!balanceResponse.errorCode) {
      this.logger.debug(`Retrieving balance for contis account ${details.accountId} failed`)

      throw Error(`Unable to validate card for account with accountId: ${details.accountId}`)
    }

    // The balance received is in coins
    return new Decimal(balanceResponse.responseBody!.AvailableBalance).dividedBy(100).toNumber()
  }

  public async getActiveCardDetails(details: ContisAccountDetails): Promise<ContisCardResult | null> {
    const referenceId: string = this.contisClient.generateReferenceId()

    const listCardsResponse = await this.listCards(details.accountId, referenceId)
    return listCardsResponse.CardResList.find(({ CardStatus }) => CardStatus === NORMAL_CARD_STATE) || null
  }

  public async getLatestCardDetails(details: ContisAccountDetails): Promise<ContisCardResult | null> {
    const referenceId: string = this.contisClient.generateReferenceId()

    const { CardResList } = await this.listCards(details.accountId, referenceId)
    CardResList.sort(({ CardIssueDate: cardAIssueDate }, { CardIssueDate: cardBIssueDate }) =>
      moment(cardAIssueDate).isAfter(cardBIssueDate) ? -1 : 1,
    )

    return CardResList[0]
  }

  public async validateLastFourDigits(
    { consumerId, accountId }: ContisAccountDetails,
    lastFourDigits: string,
  ): Promise<LastFourDigitValidationResponse> {
    const referenceId: string = this.contisClient.generateReferenceId()

    const validateLastFourDigitsRequest = new ValidateLastFourDigitsRequest(lastFourDigits, accountId, referenceId)

    const validateLastFourDigitsResponse: ContisResponse<GenericContisResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.validateLastFourDigits,
      validateLastFourDigitsRequest,
      encryptedLastFourDigitsResponse => new GenericContisResponse(encryptedLastFourDigitsResponse),
    )

    if (!!validateLastFourDigitsResponse.errorCode) {
      this.logger.debug(`Validating last four digits of card number for Contis consumer ${consumerId} failed`)

      throw Error(
        `Unable to validate card for account with consumerId: ${consumerId} Error: ${validateLastFourDigitsResponse.errorCode}`,
      )
    }

    return {
      valid: validateLastFourDigitsResponse.responseBody!.Description === 'Success',
    }
  }

  private async viewPin(cardId: number, cvv: string, dob: string, referenceId: string): Promise<ViewPinResponse> {
    const viewPinResponse: ContisResponse<ViewPinResponse> = await this.contisClient.sendRequest(
      ContisEndpointPath.viewPin,
      new ViewPinRequest(cardId, dob, referenceId, cvv),
      encryptedResponse => new ViewPinResponse(encryptedResponse),
    )

    if (!!viewPinResponse.errorCode) {
      throw Error(`Unable to get Contis debit card pin. Error: ${viewPinResponse.errorCode}`)
    }

    return viewPinResponse.responseBody!
  }
}
