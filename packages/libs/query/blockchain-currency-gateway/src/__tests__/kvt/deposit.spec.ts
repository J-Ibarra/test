// import { expect } from 'chai'
// import { Wallet } from 'ethers'
// import * as sinon from 'sinon'
// import { KVT } from '../../kvt'
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
// import { getAccount } from '../../ethereum/test_helpers'
// import KinesisVelocityToken from '../../kvt/contracts/KinesisVelocityToken.json'
// import { deployContract, KVTContract } from '../../kvt/test_helper'

// describe('kvt deposits', () => {
//   const currencyToDepositRequests = 'currencyToDepositRequests'
//   const abi = KinesisVelocityToken.abi
//   const byteCode = KinesisVelocityToken.bytecode
//   let kvt: KVT = null
//   let kvtContract: KVTContract = null
//   let admin: Wallet = null
//   let client: Wallet = null
//   let pendingHoldingsTransferGatekeeper: DepositGatekeeper
//   let pendingCompletionDepositsGatekeeper: DepositGatekeeper
//   const balanceMovementFacade = BalanceMovementFacade.getInstance()
//   let pendingSuspendedDepositGatekeeper: DepositGatekeeper

//   before(async function() {
//     this.timeout(30_000)
//     await deployContract(abi, byteCode)
//     kvt = new KVT(Environment.test)
//     kvtContract = new KVTContract(kvt.contract)
//     admin = getAccount(1)
//     client = getAccount(2)

//     // We use the owner here as it has all the ETH, so we just use it to pay for fee's.
//     pendingHoldingsTransferGatekeeper = new DepositGatekeeper('pendingHoldingsTransferGatekeeper')
//     pendingSuspendedDepositGatekeeper = new DepositGatekeeper('pendingSuspendedDepositGatekeeper')
//     pendingCompletionDepositsGatekeeper = new DepositGatekeeper('pendingCompletionDepositsGatekeeper')

//     await kvtContract.quickAccountSetup(admin.address)
//   })

//   afterEach(() => {
//     sinon.restore()
//   })

//   it('it updates kvt balance when sent', async () => {
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

//     process.env.ETHEREUM_HOLDINGS_SECRET = getAccount(0).privateKey

//     const manager = new CurrencyManager(Environment.test, [CurrencyCode.kvt])

//     // quickAccountSetup() gives this wallet 5000 KVT from the start
//     const customerOnchainWallet = client
//     const customerExchangeAccount = await createTemporaryTestingAccount(AccountType.individual, false)
//     await updateAccount(customerExchangeAccount.id, { status: AccountStatus.emailVerified })

//     sinon.stub(midPriceCalculatorFunctions, 'calculateRealTimeMidPriceForSymbol').resolves(41)

//     const depositAddress = await createNewDepositAddress(manager, customerExchangeAccount.id, CurrencyCode.kvt)
//     const { id: kvtCurrencyId } = await findCurrencyForCode(CurrencyCode.kvt)

//     const amount = 100
//     const { txHash } = await kvt.transferTo({
//       privateKey: customerOnchainWallet.privateKey,
//       amount,
//       toAddress: depositAddress.publicKey,
//     })

//     await checkForNewDepositsForCurrency(pendingHoldingsTransferGatekeeper, CurrencyCode.kvt, manager)

//     const pendingRequests = await getPendingDepositRequests(kvtCurrencyId)
//     expect(pendingRequests.length).to.eql(1)
//     expect(pendingRequests[0].depositTxHash).to.eql(txHash)

//     // Due to Test eth network, need to send more transfers to trigger block updates
//     await processNewestDepositRequestForCurrency(
//       pendingHoldingsTransferGatekeeper,
//       pendingCompletionDepositsGatekeeper,
//       pendingSuspendedDepositGatekeeper,
//       CurrencyCode.kvt,
//       manager,
//     )

//     const depositAddressBalanceBeforeConfirmation = await kvt.balanceAt(depositAddress.publicKey)
//     expect(depositAddressBalanceBeforeConfirmation).to.eql(amount)

//     // We want to make sure the new deposit request is not locked after failing the transaction confirmation check
//     expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kvt).length).to.eql(1)
//     expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kvt)[0].isLocked).to.eql(false)

//     for (let i = 5; i < 10; i++) {
//       await kvt.transferTo({
//         privateKey: getAccount(i).privateKey,
//         amount: 100,
//         toAddress: getAccount(i + 1).address,
//       })
//     }

//     await processNewestDepositRequestForCurrency(
//       pendingHoldingsTransferGatekeeper,
//       pendingCompletionDepositsGatekeeper,
//       pendingSuspendedDepositGatekeeper,
//       CurrencyCode.kvt,
//       manager,
//     )

//     const accountBalance = await BalanceRetrievalFacade.getInstance().findBalance(CurrencyCode.kvt, customerExchangeAccount.id)

//     expect(accountBalance.pendingDeposit.value).to.eql(amount)
//     expect(accountBalance.available.value).to.eql(0)

//     // Making sure the deposit request was removed from the pending holdings transfer requests
//     expect(pendingHoldingsTransferGatekeeper[currencyToDepositRequests].get(CurrencyCode.kvt).length).to.eql(0)
//     // Making sure the request has been added to pending completion requests
//     expect(pendingCompletionDepositsGatekeeper[currencyToDepositRequests].get(CurrencyCode.kvt).length).to.eql(1)

//     const depositAddressBalanceAfterConfirmation = await kvt.balanceAt(depositAddress.publicKey)
//     expect(depositAddressBalanceAfterConfirmation).to.eql(0)
//   }).timeout(20000)
// })
