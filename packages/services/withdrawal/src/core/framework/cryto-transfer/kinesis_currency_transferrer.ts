import { Transaction } from 'sequelize'
import { Logger } from '@abx-utils/logging'
import { Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { KinesisCurrencies } from '@abx-types/reference-data'
import { WithdrawalKinesisCoinEmission } from '@abx-types/withdrawal'
import {
  createWithdrawalEmission,
  findWithdrawalEmission,
  getLatestWithdrawalEmissionSequenceNumber,
} from '../../lib/common/kinesis_coin_emission_operations'

const logger = Logger.getInstance('crypto-transfer', 'kinesis_currency_transferrer')

interface WithdrawalKinesisCurrencyTransferParams {
  withdrawalRequestId: number
  kinesisCurrencyGateway: Kinesis
  targetAddress: string
  memo: string
  amount: number
}

export async function transferWithdrawalFundsForKinesisCurrency(params: WithdrawalKinesisCurrencyTransferParams, transaction: Transaction) {
  const { txEnvelope } = await getWithdrawalEmissionEntry(params, transaction)

  return params.kinesisCurrencyGateway.transferFromExchangeHoldings(txEnvelope)
}

async function getWithdrawalEmissionEntry(
  params: WithdrawalKinesisCurrencyTransferParams,
  transaction: Transaction,
): Promise<WithdrawalKinesisCoinEmission> {
  const existingEmissionRecordFromPrevousAttempt = await findWithdrawalEmission(params.withdrawalRequestId)

  if (!!existingEmissionRecordFromPrevousAttempt) {
    return existingEmissionRecordFromPrevousAttempt
  }

  const latestWithdrawalEmissionSequenceNumber = await getLatestWithdrawalEmissionSequenceNumber(params.kinesisCurrencyGateway.ticker)

  const { txEnvelope, nextSequenceNumber } = await params.kinesisCurrencyGateway.createWithdrawalHoldingsTransactionEnvelope(
    params.amount,
    params.targetAddress,
    params.memo,
    latestWithdrawalEmissionSequenceNumber,
  )
  logger.debug(`Next sequence number: ${nextSequenceNumber}`)

  return createWithdrawalEmission(
    {
      currency: params.kinesisCurrencyGateway.ticker as KinesisCurrencies,
      withdrawalRequestId: params.withdrawalRequestId,
      sequence: nextSequenceNumber,
      txEnvelope,
    },
    transaction,
  )
}
