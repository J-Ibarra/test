// import { expect } from 'chai'
// import * as sinon from 'sinon'
// import { Ethereum } from '.'
// import { Environment } from '../../../../interfaces'
// import { AccountStatus, AccountType, findOrCreateKinesisRevenueAccount, updateAccount } from '../../../accounts'
// import { BalanceMovementFacade, BalanceRetrievalFacade, SourceEventType } from '../../../balances'
// import { CurrencyManager } from '@abx-types/reference-data'
// import sequelize from '../../../db/abx_modules'
// import { createTemporaryTestingAccount } from '../../../db/test_helpers/test_accounts'
// import { wrapInTransaction } from '../../../db/transaction_wrapper'
// import { checkForNewDepositsForCurrency, createNewDepositAddress, DepositGatekeeper, processNewestDepositRequestForCurrency } from '../../../deposits'
// import { getPendingDepositRequests } from '../../../deposits/lib/deposit_request'
// import * as midPriceCalculatorFunctions from '../../../market-data/lib/real_time_mid_price_calculator'
// import { CurrencyCode, findCurrencyForCode } from '@abx-types/reference-data'
// import { getAccount } from './test_helpers'

// describe('ethereum deposits', () => {
//   const currencyToDepositRequests = 'currencyToDepositRequests'
//   const ethereum = new Ethereum(Environment.test)
//   let pendingHoldingsTransferGatekeeper: DepositGatekeeper
//   let pendingCompletionDepositsGatekeeper: DepositGatekeeper
//   const balanceMovementFacade = BalanceMovementFacade.getInstance()
//   let pendingSuspendedDepositGatekeeper: DepositGatekeeper

//   beforeEach(async () => {
//     pendingHoldingsTransferGatekeeper = new DepositGatekeeper('pendingHoldingsTransferGatekeeper')
//     pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pendingSuspendedDepositGatekeeper')
//     pendingCompletionDepositsGatekeeper = new DepositGatekeeper('pendingCompletionDepositsGatekeeper')
//   })

//   afterEach(() => {
//     sinon.restore()
//   })

//   it('it updates ethereum balance when sent', async () => {
//     const manager = new CurrencyManager(Environment.test, [CurrencyCode.ethereum])
//     const sendingAccount = getAccount(0)
//     const exchangeAccount = await createTemporaryTestingAccount(AccountType.individual, false)
//     await updateAccount(exchangeAccount.id, { status: AccountStatus.emailVerified })

//     await wrapInTransaction(sequelize, null, async t => {
//       // Create an Eth Balance so it doesn't error when it deducts ETH for the Fee from K-Rev
//       const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount({ transaction: t })
//       await balanceMovementFacade.updateAvailable({
//         accountId: kinesisRevenueAccount.id,
//         amount: 100,
//         currencyId: 1,
//         sourceEventId: 1,
//         sourceEventType: SourceEventType.adminRequest,
//         t,
//       })
//     })

//     sinon.stub(midPriceCalculatorFunctions, 'calculateRealTimeMidPriceForSymbol').resolves(41)

//     const depositAddress = await createNewDepositAddress(manager, exchangeAccount.id, CurrencyCode.ethereum)

//     const amount = 0.5
//     const { txHash } = await ethereum.transferTo({
//       privateKey: sendingAccount.privateKey,
//       amount,
//       toAddress: depositAddress.publicKey,
//     })

//     const postTransferDepositAddressBalance = await ethereum.balanceAt(depositAddress.publicKey)
//     expect(postTransferDepositAddressBalance).to.eql(amount)

//     const { id: ethereumCurrencyId } = await findCurrencyForCode(CurrencyCode.ethereum)

//     await checkForNewDepositsForCurrency(pendingHoldingsTransferGatekeeper, CurrencyCode.ethereum, manager)

//     const pendingRequests = await getPendingDepositRequests(ethereumCurrencyId)
//     expect(pendingRequests.length).to.eql(1)
//     expect(pendingRequests[0].depositTxHash).to.eql(txHash)

//     // Due to Test eth network, need to send more transfers to trigger block updates
//     await processNewestDepositRequestForCurrency(
//       pendingHoldingsTransferGatekeeper,
//       pendingCompletionDepositsGatekeeper,
//       pendingSuspendedDepositGatekeeper,
//       CurrencyCode.ethereum,
//       manager,
//     )

//     // We want to make sure the new deposit request is not locked after failing the transaction confirmation check
//     expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.ethereum).length).to.eql(1)
//     expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.ethereum)[0].isLocked).to.eql(false)

//     for (let i = 0; i < 10; i++) {
//       await ethereum.transferTo({
//         privateKey: getAccount(i).privateKey,
//         amount: 0.01,
//         toAddress: getAccount(i + 1).address,
//       })
//     }

//     const depositAddressBalance = await ethereum.balanceAt(depositAddress.publicKey)
//     expect(depositAddressBalance).to.eql(amount)

//     // This involves a move to a holding address
//     const holdingAccount = getAccount(11)
//     process.env.ETHEREUM_HOLDINGS_SECRET = holdingAccount.privateKey
//     const initialHoldingsBalance = await ethereum.balanceAt(holdingAccount.address)

//     await processNewestDepositRequestForCurrency(
//       pendingHoldingsTransferGatekeeper,
//       pendingCompletionDepositsGatekeeper,
//       pendingSuspendedDepositGatekeeper,
//       CurrencyCode.ethereum,
//       manager,
//     )
//     // Making sure the deposit request was removed from the pending holdings transfer requests
//     expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.ethereum).length).to.eql(0)
//     // Making sure the request has been added to pending completion requests
//     expect(pendingCompletionDepositsGatekeeper[currencyToDepositRequests].get(CurrencyCode.ethereum).length).to.eql(1)

//     const accountBalance = await BalanceRetrievalFacade.getInstance().findBalance(CurrencyCode.ethereum, exchangeAccount.id)

//     expect(accountBalance.pendingDeposit.value).to.eql(amount)
//     expect(accountBalance.available.value).to.eql(0)

//     const holdingsBalance = await ethereum.balanceAt(holdingAccount.address)
//     expect(holdingsBalance - initialHoldingsBalance).to.be.approximately(amount, 0.01)
//     const depositAddressBalanceAfterConfirmation = await ethereum.balanceAt(depositAddress.publicKey)
//     expect(depositAddressBalanceAfterConfirmation).to.eql(0)
//   }).timeout(20000)
// })
