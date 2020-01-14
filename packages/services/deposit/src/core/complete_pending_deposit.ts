import Decimal from 'decimal.js'
import { get } from 'lodash'
import { Transaction } from 'sequelize'

import { recordCustomEvent } from 'newrelic'
import { findOrCreateKinesisRevenueAccount, findUserByAccountId } from '@abx-service-clients/account'
import { SourceEventType } from '@abx-types/balance'
import { findBoundaryForCurrency, findCurrencyForId, isFiatCurrency, getFiatCurrencySymbol } from '@abx-service-clients/reference-data'
import { Logger } from '@abx/logging'
import { Email, EmailTemplates } from '@abx-types/notification'
import { CurrencyCode } from '@abx-types/reference-data'
import { createCurrencyTransaction } from '@abx-service-clients/order'
import { DepositRequest, DepositRequestStatus } from '../../interfaces'
import { findDepositAddressForId } from './deposit_address'
import { updateDepositRequest } from './deposit_request'

const logger = Logger.getInstance('completePendingDeposit', 'deposits')

export async function completePendingDeposit(request: DepositRequest, transaction: Transaction) {
  const confirmedRequest = request
  if (!request.depositAddress) {
    const addressForDeposit = await findDepositAddressForId(request.depositAddressId)

    confirmedRequest.depositAddress = addressForDeposit
  }

  const [, currencyTransaction] = await Promise.all([
    updateDepositRequest(confirmedRequest.id, { status: DepositRequestStatus.completed }, transaction).then(() =>
      logger.debug(
        `Confirmed Deposit Request ${confirmedRequest.id} for ${confirmedRequest.amount} at address: ${confirmedRequest.depositAddress.publicKey}`,
      ),
    ),
    createCurrencyTransaction(
      {
        accountId: confirmedRequest.depositAddress.accountId,
        amount: confirmedRequest.amount,
        currencyId: confirmedRequest.depositAddress.currencyId,
        direction: TransactionDirection.deposit,
        requestId: confirmedRequest.id,
      },
      transaction,
    ).then(depositCurrencyTransaction => {
      logger.debug(
        `Completed Currency Transaction for deposit request ${confirmedRequest.id} of ${confirmedRequest.amount} at address: ${confirmedRequest.depositAddress.publicKey}`,
      )

      return depositCurrencyTransaction
    }),
  ])

  await BalanceMovementFacade.getInstance().confirmPendingDeposit({
    accountId: currencyTransaction.accountId,
    amount: currencyTransaction.amount,
    currencyId: currencyTransaction.currencyId,
    sourceEventId: currencyTransaction.id,
    sourceEventType: SourceEventType.currencyDeposit,
    t: transaction,
  })

  const { code: currencyCode } = await findCurrencyForId(confirmedRequest.depositAddress.currencyId)
  await rebateOnChainFeeFromKinesisRevenueAccount(confirmedRequest, currencyCode, transaction)

  logger.debug(`Confirmed pending deposit in the Database for: ${confirmedRequest.amount} at address: ${confirmedRequest.depositAddress.publicKey}`)

  const { depositAddress, amount } = confirmedRequest
  const { code } = await findCurrencyForId(confirmedRequest.depositAddress.currencyId)
  return sendDepositConfirmEmail(depositAddress.accountId, amount, code)
}

const currencyToCoverOnChainFeeFor = [CurrencyCode.ethereum, CurrencyCode.kvt]

async function rebateOnChainFeeFromKinesisRevenueAccount(confirmedRequest: DepositRequest, currencyCode: CurrencyCode, transaction: Transaction) {
  if (currencyToCoverOnChainFeeFor.includes(currencyCode)) {
    const [kinesisRevenueAccount, currencyId] = await Promise.all([
      findOrCreateKinesisRevenueAccount({ transaction }),
      getDepositFeeCurrencyId(currencyCode),
    ])

    await BalanceMovementFacade.getInstance().confirmPendingWithdrawal({
      accountId: kinesisRevenueAccount.id,
      amount: confirmedRequest.holdingsTxFee ? new Decimal(confirmedRequest.holdingsTxFee).toNumber() : 0,
      currencyId,
      sourceEventId: confirmedRequest.id,
      sourceEventType: SourceEventType.currencyDeposit,
      t: transaction,
    })
  }
}

async function sendDepositConfirmEmail(accountId: string, amount: number, currencyCode: CurrencyCode) {
  if (isFiatCurrency(currencyCode)) {
    return
  }

  const user = await findUserByAccountId(accountId)
  logger.debug(`Found user for account: ${accountId}`)

  const url = process.env.KMS_DOMAIN + '/login'
  const currencyBoundary = await findBoundaryForCurrency(currencyCode)

  const templateContent = {
    name: user.firstName || '',
    fiatSymbol: getFiatCurrencySymbol(currencyCode),
    depositAmount: new Decimal(amount).toFixed(get(currencyBoundary, 'maxDecimals', 0)),
    cryptoSymbol: isFiatCurrency(currencyCode) ? '' : currencyCode,
    username: user.email,
    KINESISMONEYLOGIN: url,
  }

  const emailRequest: Email = {
    to: user.email,
    subject: 'Kinesis Money Deposit Success',
    templateName: EmailTemplates.DepositConfirmation,
    templateContent,
  }

  logger.debug(`Sending deposit confirming email for account ${accountId} and quantity ${amount}`)

  recordCustomEvent('event_crypto_deposit_completion_email', {
    toAccountId: accountId,
    amount,
    currency: currencyCode,
  })

  const epicurus = getInstance()
  await epicurus.request(EpicurusRequestChannel.createEmail, emailRequest)
}
