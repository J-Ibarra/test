import { CurrencyCode } from '@abx-types/reference-data'

/** The URL of the queue where the address transactions are pushed for a given deposit address. */
export const DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL =
  process.env.DEPOSIT_ADDRESS_TRANSACTION_QUEUE_URL! || 'local-deposit-address-unconfirmed-transaction-queue'

export const ECR20_TOKENS_WITH_ETH_FEE = [CurrencyCode.kvt, CurrencyCode.tether]
