import { CurrencyCode } from '@abx-types/reference-data'

/** The URL of the queue where the confirmed deposit transaction details are pushed. */
export const DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL =
  process.env.DEPOSIT_CONFIRMED_TRANSACTION_QUEUE_URL! || 'local-deposit-confirmed-transaction-queue'

/** The URL of the queue where the holdings transaction confirmation events are pushed. */
export const DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL =
  process.env.DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_QUEUE_URL! || 'local-holdings-transactions-queue'

/** The URL of the queue where the unconfirmed transactions are pushed for a given deposit address. */
export const DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL =
  process.env.DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL! || 'local-deposit-address-unconfirmed-transaction-queue'

export const ECR20_TOKENS_WITH_ETH_FEE = [CurrencyCode.kvt, CurrencyCode.tether]
