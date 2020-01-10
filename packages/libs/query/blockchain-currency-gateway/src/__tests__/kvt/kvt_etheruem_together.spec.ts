// import { expect } from 'chai'
// import { Wallet } from 'ethers'
// import { KVT } from '../../kvt'
// import { Environment } from '../../../../interfaces'
// import { Ethereum } from '../../ethereum'
// import { getAccount } from '../../ethereum/test_helpers'
// import KinesisVelocityToken from '../../kvt/contracts/KinesisVelocityToken.json'
// import { deployContract, KVTContract } from '../../kvt/test_helper'

// describe('KVT & ETH integration', () => {
//   const abi = KinesisVelocityToken.abi
//   const byteCode = KinesisVelocityToken.bytecode
//   let kvt: KVT = null
//   let kvtContract: KVTContract = null
//   let owner: Wallet = null
//   let firstAdmin: Wallet = null
//   let secondAdmin: Wallet = null
//   let firstClient: Wallet = null
//   const firstClientFund: number = 4000
//   let secondClient: Wallet = null
//   const secondClientFund: number = 2000

//   const ethereum = new Ethereum(Environment.test)

//   before(async () => {
//     await deployContract(abi, byteCode)
//     kvt = new KVT(Environment.test)
//     kvtContract = new KVTContract(kvt.contract)
//     owner = getAccount(0)
//     firstAdmin = getAccount(1)
//     secondAdmin = getAccount(2)
//     firstClient = getAccount(3)
//     secondClient = getAccount(4)
//   })
//   /* =========== For testing env setup purpose =============== */
//   describe('KVT deploy', () => {
//     describe('admin', () => {
//       it('add account to admin role', async () => {
//         const isAdminBefore1 = await kvtContract.isAdmin(firstAdmin.address)
//         const isAdminBefore2 = await kvtContract.isAdmin(secondAdmin.address)
//         expect(isAdminBefore1).to.equal(false)
//         expect(isAdminBefore2).to.equal(false)
//         await kvtContract.addAdmin(firstAdmin.address)
//         await kvtContract.addAdmin(secondAdmin.address)
//         const isAdminAfter1 = await kvtContract.isAdmin(firstAdmin.address)
//         const isAdminAfter2 = await kvtContract.isAdmin(secondAdmin.address)
//         expect(isAdminAfter1).to.equal(true)
//         expect(isAdminAfter2).to.equal(true)
//       })
//     })

//     // Fund the first client
//     describe('admin transferring', () => {
//       it('firstAdmin transfer to client not approve yet', async () => {
//         await kvtContract.adminTransfer(owner.address, firstClient.address, firstClientFund + secondClientFund)
//         const receiverBalance = await kvt.balanceAt(firstClient.address)
//         expect(receiverBalance).to.eql(0)
//       })

//       it('admin2 approve the transfer', async () => {
//         const transfer = await kvtContract.getTransfers()
//         await kvtContract.approveTransfer(secondAdmin.address, transfer[0])
//         const receiverBalance = await kvt.balanceAt(firstClient.address)
//         expect(receiverBalance).to.eql(firstClientFund + secondClientFund)
//       })
//     })

//     // Set kvt transferable
//     describe('set transferable', () => {
//       it('kvt not transferable', async () => {
//         try {
//           await kvt.transferTo({
//             privateKey: firstClient.privateKey,
//             amount: 1000,
//             toAddress: secondClient.address,
//           })
//         } catch (e) {
//           const error = 'revert kvt is not yet transferable'
//           expect(e.message.indexOf(error)).to.be.greaterThan(-1)
//         }
//       })
//       it('approve transferable', async () => {
//         await kvtContract.setTransferable(firstAdmin.address, true)
//         await kvtContract.approveTransferableToggle(secondAdmin.address)
//         await kvt.transferTo({
//           privateKey: firstClient.privateKey,
//           amount: secondClientFund,
//           toAddress: secondClient.address,
//         })
//         const balance = await kvt.balanceAt(secondClient.address)
//         expect(balance).to.be.equal(secondClientFund)
//       })
//     })
//   })

//   /* ============== Testing the KVT + Eth ============== */
//   describe('balanceAt', () => {
//     it('throws an error when passed in an invalid address in KVT', async () => {
//       try {
//         const KVTBalance = await kvt.balanceAt('abcd')
//         const ETHBalance = await ethereum.balanceAt('abcd')
//       } catch (e) {
//         expect(e.message.indexOf('invalid')).to.be.greaterThan(-1)
//       }
//     })

//     it('throws an error when passed in an invalid address in ETH', async () => {
//       try {
//         await ethereum.balanceAt('abcd')
//       } catch (e) {
//         expect(e.message.indexOf('invalid')).to.be.greaterThan(-1)
//       }
//     })

//     it('returns the correct balance in KVT and ETH', async () => {
//       const secondAddress = '0x8180368b9c50C8d01c7e53D5B99F575189b7f177'
//       expect(getAccount(1).address).to.eql(secondAddress)

//       const KVTInitialBalance = await kvt.balanceAt(secondAddress)
//       const ETHInitialBalance = await ethereum.balanceAt(secondAddress)
//       expect(KVTInitialBalance).to.be.a('number')
//       expect(ETHInitialBalance).to.be.a('number')

//       const KVTSecondCall = await kvt.balanceAt(secondAddress)
//       const ETHSecondCall = await ethereum.balanceAt(secondAddress)
//       expect(KVTSecondCall).to.eql(KVTInitialBalance)
//       expect(ETHSecondCall).to.eql(ETHInitialBalance)
//     })

//     it('correctly update after transfer', async () => {
//       const fundedAccount = firstClient
//       const receiveAccount = secondClient

//       const KVTAmountToTransfer = 1000
//       const KVTInitialFundedBalance = await kvt.balanceAt(fundedAccount.address)
//       const KVTInitialReceiveBalance = await kvt.balanceAt(receiveAccount.address)

//       const ETHAmountToTransfer = 0.15
//       const ETHInitialFundedBalance = await ethereum.balanceAt(fundedAccount.address)
//       const ETHInitialReceiveBalance = await ethereum.balanceAt(receiveAccount.address)

//       await kvt.transferTo({
//         privateKey: fundedAccount.privateKey,
//         amount: KVTAmountToTransfer,
//         toAddress: receiveAccount.address,
//       })

//       await ethereum.transferTo({
//         privateKey: fundedAccount.privateKey,
//         amount: ETHAmountToTransfer,
//         toAddress: receiveAccount.address,
//       })

//       const KVTAfterFundedBalance = await kvt.balanceAt(fundedAccount.address)
//       const KVTAfterReceiveBalance = await kvt.balanceAt(receiveAccount.address)

//       const ETHAfterFundedBalance = await ethereum.balanceAt(fundedAccount.address)
//       const ETHAfterReceiveBalance = await ethereum.balanceAt(receiveAccount.address)

//       expect(KVTAfterFundedBalance).to.be.eql(KVTInitialFundedBalance - KVTAmountToTransfer)
//       expect(KVTAfterReceiveBalance).to.be.eql(KVTInitialReceiveBalance + KVTAmountToTransfer)
//       expect(ETHAfterFundedBalance).to.approximately(ETHInitialFundedBalance - ETHAmountToTransfer, 0.01)
//       expect(ETHAfterReceiveBalance).to.approximately(ETHInitialReceiveBalance + ETHAmountToTransfer, 0.01)
//     })
//   })

//   describe('getDepositTransactions', () => {
//     it('returns no transactions for empty', async () => {
//       const address = kvt.getAddressFromPrivateKey(kvt.generatePrivateKey())
//       const KVTTransactions = await kvt.getDepositTransactions(address)
//       const ETHTransactions = await ethereum.getDepositTransactions(address, [])
//       expect(KVTTransactions.length).to.eql(0)
//       expect(ETHTransactions.length).to.eql(0)
//     })

//     it('returns a singular deposit transaction', async () => {
//       const depositAddress = kvt.getAddressFromPrivateKey(kvt.generatePrivateKey())
//       const fundedAccount = firstClient
//       const KVTAmount = 100
//       const ETHAmount = 0.15
//       const KVTTransaction = await kvt.transferTo({
//         amount: KVTAmount,
//         privateKey: fundedAccount.privateKey,
//         toAddress: depositAddress,
//       })
//       const ETHTransaction = await ethereum.transferTo({
//         amount: ETHAmount,
//         privateKey: owner.privateKey,
//         toAddress: depositAddress,
//       })

//       const KVTDepositTransactions = await kvt.getDepositTransactions(depositAddress)
//       expect(KVTDepositTransactions.length).to.eql(1)
//       expect(KVTDepositTransactions[0].txHash).to.eql(KVTTransaction.txHash)
//       expect(KVTDepositTransactions[0].amount).to.eql(KVTAmount)
//       expect(KVTDepositTransactions[0].from).to.eql(fundedAccount.address)

//       const ETHDepositTransactions = await ethereum.getDepositTransactions(depositAddress, [])
//       expect(ETHDepositTransactions.length).to.eql(1)
//       expect(ETHDepositTransactions[0].txHash).to.eql(ETHTransaction.txHash)
//       expect(ETHDepositTransactions[0].amount).to.eql(ETHAmount)
//       expect(ETHDepositTransactions[0].from).to.eql(owner.address)
//     })

//     it('returns multiple transactions', async () => {
//       const depositAddress = kvt.getAddressFromPrivateKey(kvt.generatePrivateKey())
//       const fundedAccount = firstClient
//       const KVTFirstAmount = 100
//       const KVTSecondAmount = 200
//       const ETHFirstAmount = 0.15
//       const ETHSecondAmount = 0.2

//       const KVTFirstTransaction = await kvt.transferTo({
//         amount: KVTFirstAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const KVTSecondTransaction = await kvt.transferTo({
//         amount: KVTSecondAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const ETHFirstTransaction = await ethereum.transferTo({
//         amount: ETHFirstAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const ETHSecondTransaction = await ethereum.transferTo({
//         amount: ETHSecondAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const KVTDepositTransactions = await kvt.getDepositTransactions(depositAddress)
//       expect(KVTDepositTransactions.length).to.eql(2)
//       expect(KVTDepositTransactions[0].txHash).to.eql(KVTFirstTransaction.txHash)
//       expect(KVTDepositTransactions[1].txHash).to.eql(KVTSecondTransaction.txHash)

//       const ETHDepositTransactions = await ethereum.getDepositTransactions(depositAddress, [])
//       expect(ETHDepositTransactions.length).to.eql(2)
//       expect(ETHDepositTransactions[0].txHash).to.eql(ETHSecondTransaction.txHash)
//       expect(ETHDepositTransactions[1].txHash).to.eql(ETHFirstTransaction.txHash)
//     })
//   })
// })
