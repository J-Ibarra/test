import { CurrencyCode } from '@abx-types/reference-data'

export const NEW_ETH_AND_KVT_DEPOSIT_REQUESTS_QUEUE_URL =
  process.env.NEW_ETH_AND_KVT_DEPOSIT_REQUESTS_QUEUE_URL! || 'local-deposit-eth-and-kvt-new-request-queue'
  export const NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL =
  process.env.NEW_KINESIS_DEPOSIT_REQUESTS_QUEUE_URL! || 'local-deposit-kinesis-coin-new-request-queue'

export const ECR20_TOKENS_WITH_ETH_FEE = [CurrencyCode.kvt, CurrencyCode.tether]