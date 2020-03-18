import { Injectable } from '@nestjs/common'

import { CardProviderFacade } from './CardProviderFacade'
import {
  CompleteAccountDetails,
  ProviderAccountDetails,
  DebitCardProvider,
  ContisAccountDetails,
  CoreTransactionDetails,
  Address,
} from '../../models'
import { ContisQueryHandler } from './contis/ContisQueryHandler'
import { ContisUpdateHandler } from './contis/ContisUpdateHandler'
import { LastFourDigitValidationResponse, CardDetails } from './responses'

export const INACTIVE_CARD_STATUS = 3

@Injectable()
export class ContisCardProviderFacade implements CardProviderFacade {
  constructor(private contisQueryHandler: ContisQueryHandler, private contisUpdateHandler: ContisUpdateHandler) {}

  getProvider(): DebitCardProvider {
    return DebitCardProvider.contis
  }

  public async loadBalance(
    topUpRequestId: number,
    accountDetails: ContisAccountDetails,
    amount: number,
  ): Promise<{ transactionId: number }> {
    return this.contisUpdateHandler.loadBalance(topUpRequestId, accountDetails, amount)
  }

  public async unloadBalance(accountDetails: ContisAccountDetails, amount: number): Promise<number> {
    return await this.contisUpdateHandler.unloadBalance(accountDetails, amount)
  }

  public async createAccount(accountDetails: CompleteAccountDetails, presentAddress: Address): Promise<ProviderAccountDetails> {
    return this.contisUpdateHandler.createAccount(accountDetails, presentAddress)
  }

  public async getLatestCardDetails(accountDetails: ProviderAccountDetails): Promise<CardDetails | null> {
    const contisCardDetails = await this.contisQueryHandler.getLatestCardDetails(accountDetails as ContisAccountDetails)

    return !!contisCardDetails
      ? {
          id: contisCardDetails.CardID,
          cardDisplayName: contisCardDetails.CardDisplayName,
          obscuredCardNumber: contisCardDetails.ObscuredCardNumber,
        }
      : null
  }

  public async activateCard(details: ContisAccountDetails, cvv: string, dob: string): Promise<void> {
    await this.contisUpdateHandler.activateCard(details, cvv, dob)
  }

  public async getPin(details: ContisAccountDetails, cvv: string, dob: string): Promise<string> {
    return this.contisQueryHandler.getPin(details, cvv, dob)
  }

  getTransactions({ accountId }: ContisAccountDetails, from: Date, to: Date): Promise<CoreTransactionDetails[]> {
    return this.contisQueryHandler.getTransactions(accountId, from, to)
  }

  public async getActiveCardDetails(details: ContisAccountDetails): Promise<CardDetails | null> {
    const contisCardDetails = await this.contisQueryHandler.getActiveCardDetails(details)

    return (
      contisCardDetails && {
        id: contisCardDetails.CardID,
        obscuredCardNumber: contisCardDetails.ObscuredCardNumber,
        cardDisplayName: contisCardDetails.CardDisplayName,
      }
    )
  }

  public async validateLastFourDigits(
    details: ContisAccountDetails,
    lastFourDigits: string,
  ): Promise<LastFourDigitValidationResponse> {
    return this.contisQueryHandler.validateLastFourDigits(details, lastFourDigits)
  }

  getAccountBalance(details: ContisAccountDetails): Promise<number> {
    return this.contisQueryHandler.getAccountBalance(details)
  }

  public async lockCard({ cardId, consumerId }: ContisAccountDetails): Promise<void> {
    await this.contisUpdateHandler.lockCard(cardId!, consumerId)
  }

  public async unlockCard({ cardId, consumerId }: ContisAccountDetails): Promise<void> {
    await this.contisUpdateHandler.setCardAsNormal(cardId!, consumerId)
  }

  public async setCardAsLostWithReplacement({ cardId, consumerId }: ContisAccountDetails): Promise<void> {
    await this.contisUpdateHandler.setCardAsLostWithReplacement(cardId!, consumerId)
  }

  public async setCardAsDamaged({ cardId, consumerId }: ContisAccountDetails): Promise<void> {
    await this.contisUpdateHandler.setCardAsDamaged(cardId!, consumerId)
  }

  public async suspendAccount(details: ContisAccountDetails): Promise<void> {
    return this.contisUpdateHandler.suspendConsumer(details.consumerId)
  }

  public async setAccountBackToNormal(details: ContisAccountDetails): Promise<void> {
    await this.contisUpdateHandler.setConsumerAsNormal(details.consumerId)
  }
}
