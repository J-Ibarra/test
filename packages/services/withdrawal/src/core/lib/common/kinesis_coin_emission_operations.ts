import { sequelize, getModel } from '@abx-utils/db-connection-utils'
import { CurrencyCode } from '@abx-types/reference-data'
import { WithdrawalKinesisCoinEmission } from '@abx-types/withdrawal'

export async function findWithdrawalEmission(withdrawalRequestId: number): Promise<WithdrawalKinesisCoinEmission | null> {
  const mintEmission = await getModel<WithdrawalKinesisCoinEmission>('withdrawalKinesisCoinEmission').findOne({
    where: {
      withdrawalRequestId,
    },
  })

  return mintEmission ? mintEmission.get() : null
}

export async function getLatestWithdrawalEmissionSequenceNumber(currency: CurrencyCode): Promise<string> {
  const [{ max: largestSequence }] = await sequelize.query(
    `
    select max(sequence) from withdrawal_kinesis_coin_emission where currency = :currency;
  `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        currency,
      },
    },
  )

  return largestSequence || '0'
}

export async function createWithdrawalEmission({
  currency,
  withdrawalRequestId,
  sequence,
  txEnvelope,
}: WithdrawalKinesisCoinEmission): Promise<WithdrawalKinesisCoinEmission | null> {
  try {
    const createdMintEmission = await getModel<WithdrawalKinesisCoinEmission>('withdrawalKinesisCoinEmission').create({
      currency,
      withdrawalRequestId,
      sequence,
      txEnvelope,
    })

    return createdMintEmission.get()
  } catch (error) {
    // handle the case where it's due to the foreign key constraint on orderMatchTransactionId
    if (error.errors && error.errors.find(hasExistingOrderMatchId)) {
      return findWithdrawalEmission(withdrawalRequestId)
    }

    throw error
  }
}

function hasExistingOrderMatchId(error) {
  return error.path === 'withdrawalRequestId'
}
