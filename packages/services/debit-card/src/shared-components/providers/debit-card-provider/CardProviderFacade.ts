import { ProviderAccountDetails, DebitCardProvider, CoreTransactionDetails, CompleteAccountDetails, Address } from '../../models'
import { LastFourDigitValidationResponse, CardDetails } from './responses'

export interface CardProviderFacade {
  getProvider(): DebitCardProvider

  /**
   * Creates a debit card account using the details provided.
   *
   * @param accountDetails the full user account details
   */
  createAccount(accountDetails: CompleteAccountDetails, presentAddress: Address): Promise<ProviderAccountDetails>

  /**
   * Activates a new card for a given account.
   *
   * @param details the core details for the account, the actual fields vary based on the provider
   * @param cvv the card CVV number
   * @param dob the user date of birth as entered by them
   */
  activateCard(details: ProviderAccountDetails, cvv: string, dob: string): Promise<void>

  /**
   * Retrieves the card pin for a given account.
   *
   * @param details the core details for the account, the actual fields vary based on the provider
   * @param cvv the card CVV number
   * @param dob the user date of birth as entered by them
   */
  getPin(details: ProviderAccountDetails, cvv: string, dob: string): Promise<string>

  /**
   * Retrieves all transactions for a given card.
   *
   * @param details the core details for the account, the actual fields vary based on the provider
   * @param from defines the start of the transaction timeframe to retrieve transactions for
   * @param from defines the end of the transaction timeframe to retrieve transactions for
   */
  getTransactions(details: ProviderAccountDetails, from: Date, to: Date): Promise<CoreTransactionDetails[]>

  /**
   * Loads funds to a given account.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   * @param amount the amount to load/top-up
   */
  loadBalance(topUpRequestId: number, accountDetails: ProviderAccountDetails, amount: number): Promise<{ transactionId: number }>

  /**
   * Withdraws funds form a given account.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   * @param amount the amount to withdraw/unload
   */
  unloadBalance(accountDetails: ProviderAccountDetails, amount: number): Promise<number>

  /**
   * Locks the card for a given user.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  lockCard(accountDetails: ProviderAccountDetails): Promise<void>

  /**
   * Unlocks a card that has been previously locked.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  unlockCard(accountDetails: ProviderAccountDetails): Promise<void>

  /**
   * Flags a card as lost and orders a replacement.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  setCardAsLostWithReplacement(accountDetails: ProviderAccountDetails): Promise<void>

  /**
   * Flags a card as damaged and orders a replacement.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  setCardAsDamaged(accountDetails: ProviderAccountDetails): Promise<void>

  /**
   * Validates the last four digits of a card's PAN number
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   * @param lastFourDigits the last four digits to use for the validation
   */
  validateLastFourDigits(details: ProviderAccountDetails, lastFourDigits: string): Promise<LastFourDigitValidationResponse>

  getAccountBalance(details: ProviderAccountDetails): Promise<number>

  /**
   * Retrieves the core card details for a card.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  getActiveCardDetails(accountDetails: ProviderAccountDetails): Promise<CardDetails | null>

  /**
   * This call is useful when a card has not yet been activated for an account.
   * For example: the account is new and the card is being activated or the account has ordered a replacement card.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  getLatestCardDetails(accountDetails: ProviderAccountDetails): Promise<CardDetails | null>

  /**
   * Suspends all operations on an account.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  suspendAccount(details: ProviderAccountDetails): Promise<void>

  /**
   * Sets a previously suspended account back to normal.
   *
   * @param accountDetails  the core details for the account, the actual fields vary based on the provider
   */
  setAccountBackToNormal(details: ProviderAccountDetails): Promise<void>
}
