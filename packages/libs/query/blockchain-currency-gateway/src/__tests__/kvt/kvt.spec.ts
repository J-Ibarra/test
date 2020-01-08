// import { expect } from 'chai'
// import { KVT } from '../../kvt'
// import { Environment } from '../../../../interfaces'
// import { getAccount } from '../../ethereum/test_helpers'
// import KinesisVelocityToken from '../../kvt/contracts/KinesisVelocityToken.json'
// import { deployContract, KVTContract } from '../../kvt/test_helper'

// describe('KVT integration', () => {
//   const abi = KinesisVelocityToken.abi
//   const byteCode = KinesisVelocityToken.bytecode
//   let kvt
//   let kvtContract
//   let owner
//   let firstAdmin
//   let secondAdmin
//   let firstClient
//   const firstClientFund = 4000
//   let secondClient
//   const secondClientFund = 2000

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
//   describe('KVT test deploy', () => {
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

//   /* ============== Testing the KVT ============== */
//   describe('balanceAt', () => {
//     it('throws an error when passed in an invalid address', async () => {
//       try {
//         await kvt.balanceAt('abcd')
//       } catch (e) {
//         expect(e.message.indexOf('invalid address')).to.be.greaterThan(-1)
//       }
//     })

//     it('returns the correct balance in KVT', async () => {
//       const initialOwnerBalance = await kvt.balanceAt(owner.address)
//       expect(initialOwnerBalance).to.be.a('number')

//       const secondCall = await kvt.balanceAt(owner.address)
//       expect(secondCall).to.eql(initialOwnerBalance)
//     })

//     it('correctly update after transfer', async () => {
//       const fundedAccount = firstClient
//       const receiveAccount = secondClient
//       const amountToTransfer = 1000
//       const initialFundedBalance = await kvt.balanceAt(fundedAccount.address)
//       const initialReceiveBalance = await kvt.balanceAt(receiveAccount.address)

//       await kvt.transferTo({
//         privateKey: fundedAccount.privateKey,
//         amount: amountToTransfer,
//         toAddress: receiveAccount.address,
//       })

//       const afterFundedBalance = await kvt.balanceAt(fundedAccount.address)
//       const afterReceiveBalance = await kvt.balanceAt(receiveAccount.address)

//       expect(afterFundedBalance).to.be.eql(initialFundedBalance - amountToTransfer)
//       expect(afterReceiveBalance).to.be.eql(initialReceiveBalance + amountToTransfer)
//     })
//   })

//   describe('validateAddressIsNotContractAddress', () => {
//     it('correctly returns true for both a valid wallet, non-contract address', async () => {
//       const account1 = getAccount(1)
//       const isValidAddress = kvt.validateAddress(account1.address)
//       expect(isValidAddress).to.eql(true)
//       const isValidNonContractAddress = await kvt.validateAddressIsNotContractAddress(account1.address)
//       expect(isValidNonContractAddress).to.eql(true)
//     })
//     it('correctly returns true for a valid address, but false for a contract address', async () => {
//       const contractAddress = process.env.KVT_CONTRACT_ADDRESS
//       const isValidAddress = kvt.validateAddress(contractAddress)
//       expect(isValidAddress).to.eql(true)
//       const isInvalidContractAddress = await kvt.validateAddressIsNotContractAddress(contractAddress)
//       expect(isInvalidContractAddress).to.eql(false)
//     })
//   })

//   describe('getDepositTransactions', () => {
//     it('returns no transactions for empty', async () => {
//       const address = kvt.getAddressFromPrivateKey(kvt.generatePrivateKey())
//       const transactions = await kvt.getDepositTransactions(address)
//       expect(transactions.length).to.eql(0)
//     })

//     it('returns a singular deposit transaction', async () => {
//       const depositAddress = kvt.getAddressFromPrivateKey(kvt.generatePrivateKey())
//       const fundedAccount = firstClient
//       const amount = 100
//       const transaction = await kvt.transferTo({
//         amount,
//         privateKey: fundedAccount.privateKey,
//         toAddress: depositAddress,
//       })

//       const depositTransactions = await kvt.getDepositTransactions(depositAddress)
//       expect(depositTransactions.length).to.eql(1)
//       expect(depositTransactions[0].txHash).to.eql(transaction.txHash)
//       expect(depositTransactions[0].amount).to.eql(amount)
//       expect(depositTransactions[0].from).to.eql(fundedAccount.address)
//     })

//     it('returns multiple transactions', async () => {
//       const depositAddress = kvt.getAddressFromPrivateKey(kvt.generatePrivateKey())
//       const fundedAccount = firstClient
//       const firstAmount = 100
//       const secondAmount = 200

//       const firstTransaction = await kvt.transferTo({
//         amount: firstAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const secondTransaction = await kvt.transferTo({
//         amount: secondAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const depositTransactions = await kvt.getDepositTransactions(depositAddress)
//       expect(depositTransactions.length).to.eql(2)
//       expect(depositTransactions[0].txHash).to.eql(firstTransaction.txHash)
//       expect(depositTransactions[1].txHash).to.eql(secondTransaction.txHash)
//     })
//   })
// })
