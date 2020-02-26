import Decimal from 'decimal.js'
import { get } from 'lodash'
import util from 'util'

import { findAccountById, isAccountSuspended, findUserByAccountId } from '@abx-service-clients/account'
import { findBoundaryForCurrency, isFiatCurrency } from '@abx-service-clients/reference-data'
import { getOperationsEmail } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { Email, EmailTemplates } from '@abx-types/notification'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { updateDepositRequest } from '../../../../core'
import { DepositGatekeeper } from './deposit_gatekeeper'
import { createEmail } from '@abx-service-clients/notification'

const suspendDepositLogger = Logger.getInstance('suspended_deposit_request_processor', 'processSuspendedDepositRequestForCurrency')
const checkDepositLogger = Logger.getInstance('suspended_deposit_request_processor', 'processCheckingSuspendedDepositRequest')
let cachedOperationsEmail = ''

export async function processSuspendedDepositRequestForCurrency(
  pendingSuspendedDepositGatekeeper: DepositGatekeeper,
  checkingSuspendedDepositGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
) {
  const suspendedRequest = pendingSuspendedDepositGatekeeper.getNewestDepositForCurrency(currency)

  if (!suspendedRequest) {
    return
  }

  try {
    const info = {
      account: suspendedRequest.depositAddress.accountId,
      globalID: '',
      depositAddress: suspendedRequest.depositAddress.publicKey,
      cryptoAmount: suspendedRequest.amount,
      cryptoCurrency: currency,
    }
    suspendDepositLogger.info(`Suspend deposit request: ${suspendedRequest.id}`)
    suspendDepositLogger.info(JSON.stringify(info))

    await updateDepositRequest(suspendedRequest.id!, {
      status: DepositRequestStatus.suspended,
    })
    await sendDepositSuspendedEmail(suspendedRequest, currency)

    pendingSuspendedDepositGatekeeper.removeRequest(currency, suspendedRequest.id!)
    checkingSuspendedDepositGatekeeper.addNewDepositsForCurrency(currency, [suspendedRequest])
  } catch (error) {
    suspendDepositLogger.error(`Error encountered while update deposit request status and sending suspended deposit email: ${suspendedRequest.id}`)
    suspendDepositLogger.error(JSON.stringify(util.inspect(error)))
    pendingSuspendedDepositGatekeeper.unlockRequest(currency, suspendedRequest.id!)
  }
}

export async function processCheckingSuspendedDepositRequest(
  checkingSuspendedDepositGatekeeper: DepositGatekeeper,
  pendingHoldingsTransferGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
) {
  const lockDepositRequests = checkingSuspendedDepositGatekeeper.getAllDepositsForCurrency(currency)
  const pendingActivatedDepositRequests = await filterNonSuspendRequest(lockDepositRequests)

  const activateSuspendedDepositRequestsPromise = pendingActivatedDepositRequests.map(depositRequest =>
    activateSuspendedDepositRequest(depositRequest, checkingSuspendedDepositGatekeeper, currency),
  )
  await Promise.all(activateSuspendedDepositRequestsPromise)
  pendingHoldingsTransferGatekeeper.addNewDepositsForCurrency(currency, pendingActivatedDepositRequests)
}

async function sendDepositSuspendedEmail(depositRequest: DepositRequest, currencyCode: CurrencyCode) {
  const user = await findUserByAccountId(depositRequest.depositAddress.accountId)
  const account = await findAccountById(depositRequest.depositAddress.accountId)
  const currencyBoundary = await findBoundaryForCurrency(currencyCode)

  const templateContent = {
    email: user!.email,
    hin: account.hin,
    globalID: '',
    transactionHash: depositRequest.depositTxHash,
    depositAmount: new Decimal(depositRequest.amount).toFixed(get(currencyBoundary, 'maxDecimals', 0)),
    currencySymbol: isFiatCurrency(currencyCode) ? '' : currencyCode,
    depositAddress: depositRequest.depositAddress.publicKey,
  }

  suspendDepositLogger.info(`Send email for suspended deposit request: ${depositRequest.id}`)
  suspendDepositLogger.info(JSON.stringify(templateContent))

  const operationsEmail = await getOperationsEmailWithFallBack()

  const emailRequest: Email = {
    to: operationsEmail,
    subject: 'Kinesis Money Deposit For Suspended Account',
    templateName: EmailTemplates.DepositSuspendedEmail,
    templateContent,
  }

  await createEmail(emailRequest)
}

async function checkAccountSuspended(depositRequest: DepositRequest): Promise<[DepositRequest, boolean]> {
  const suspended = await isAccountSuspended(depositRequest.depositAddress.accountId)
  return [depositRequest, suspended]
}

async function filterNonSuspendRequest(depositRequests: DepositRequest[]): Promise<DepositRequest[]> {
  const checkAddressSuspendPromise = depositRequests.map(checkAccountSuspended)
  const checkAddressSuspend = await Promise.all(checkAddressSuspendPromise)
  const unsuspendedAddresses = checkAddressSuspend.reduce((acc: DepositRequest[], [request, suspended]) => {
    if (!suspended) {
      acc.push(request)
    }
    return acc
  }, [])
  return unsuspendedAddresses
}

async function activateSuspendedDepositRequest(
  depositRequest: DepositRequest,
  pendingSuspendedDepositGatekeeper: DepositGatekeeper,
  currency: CurrencyCode,
) {
  checkDepositLogger.info(`Activate suspended deposit request: ${depositRequest.id}`)
  await updateDepositRequest(depositRequest.id!, {
    status: DepositRequestStatus.pendingHoldingsTransaction,
  })
  pendingSuspendedDepositGatekeeper.removeRequest(currency, depositRequest.id!)
}

async function getOperationsEmailWithFallBack() {
  const opsEmail = cachedOperationsEmail || (await getOperationsEmail())
  cachedOperationsEmail = opsEmail

  return cachedOperationsEmail
}
