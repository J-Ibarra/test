// import { expect } from 'chai'
// import { Ethereum } from '../../ethereum'
// import { Environment } from '../../../../interfaces'
// import KinesisVelocityToken from '../../kvt/contracts/KinesisVelocityToken.json'
// import { deployContract } from '../../kvt/test_helper'
// import { getAccount } from '../../ethereum/test_helpers'

// describe('Ethereum integration', () => {
//   const abi = KinesisVelocityToken.abi
//   const byteCode = KinesisVelocityToken.bytecode
//   const ethereum = new Ethereum(Environment.test)

//   before(async () => {
//     await deployContract(abi, byteCode)
//   })

//   describe('validateAddressIsNotContractAddress', () => {
//     it('correctly returns true for both a valid wallet, non-contract address', async () => {
//       const account1 = getAccount(1)
//       const isValidAddress = ethereum.validateAddress(account1.address)
//       expect(isValidAddress).to.eql(true)
//       const isValidNonContractAddress = await ethereum.validateAddressIsNotContractAddress(account1.address)
//       expect(isValidNonContractAddress).to.eql(true)
//     })
//     it('correctly returns true for a valid address, but false for a contract address', async () => {
//       const contractAddress = process.env.KVT_CONTRACT_ADDRESS
//       const isValidAddress = ethereum.validateAddress(contractAddress)
//       expect(isValidAddress).to.eql(true)
//       const isInvalidContractAddress = await ethereum.validateAddressIsNotContractAddress(contractAddress)
//       expect(isInvalidContractAddress).to.eql(false)
//     })
//   })

//   // Funded accounts (100ETH) first 10
//   describe('balanceAt', () => {
//     it('throws an error when passed in an invalid address', async () => {
//       try {
//         const balance = await ethereum.balanceAt('abcd')
//         expect(balance).to.eql(undefined)
//       } catch (e) {
//         expect(e.message.indexOf('invalid')).to.be.greaterThan(-1)
//       }
//     })

//     it('returns the correct balance in ether', async () => {
//       const secondAddress = '0x8180368b9c50C8d01c7e53D5B99F575189b7f177'
//       expect(getAccount(1).address).to.eql(secondAddress)

//       const initialCallBalance = await ethereum.balanceAt(secondAddress)
//       expect(initialCallBalance).to.be.a('number')

//       const secondCall = await ethereum.balanceAt(secondAddress)
//       expect(secondCall).to.eql(initialCallBalance)
//     })

//     it('correctly updates after transfer', async () => {
//       const fundedAccount = getAccount(1)
//       const amountToTransfer = 0.15
//       const initialBalance = await ethereum.balanceAt(fundedAccount.address)

//       await ethereum.transferTo({
//         privateKey: fundedAccount.privateKey,
//         amount: amountToTransfer,
//         toAddress: getAccount(2).address,
//       })

//       const afterBalance = await ethereum.balanceAt(fundedAccount.address)
//       expect(initialBalance - afterBalance).to.approximately(amountToTransfer, 0.01)
//     })
//   })

//   describe('getDepositTransactions', () => {
//     it('returns no transactions for empty account', async () => {
//       const address = ethereum.getAddressFromPrivateKey(ethereum.generatePrivateKey())
//       const transactions = await ethereum.getDepositTransactions(address, [])
//       expect(transactions.length).to.eql(0)
//     })

//     it('returns a singular deposit transaction', async () => {
//       const depositAddress = ethereum.getAddressFromPrivateKey(ethereum.generatePrivateKey())
//       const fundedAccount = getAccount(0)
//       const amount = 0.15
//       const transaction = await ethereum.transferTo({
//         amount,
//         privateKey: fundedAccount.privateKey,
//         toAddress: depositAddress,
//       })

//       const depositTransactions = await ethereum.getDepositTransactions(depositAddress, [])
//       expect(depositTransactions.length).to.eql(1)
//       expect(depositTransactions[0].txHash).to.eql(transaction.txHash)
//       expect(depositTransactions[0].amount).to.eql(amount)
//       expect(depositTransactions[0].from).to.eql(fundedAccount.address)
//     })

//     it('returns multiple transactions', async () => {
//       const depositAddress = ethereum.getAddressFromPrivateKey(ethereum.generatePrivateKey())
//       const fundedAccount = getAccount(0)
//       const firstAmount = 0.15
//       const secondAmount = 0.2

//       const firstTransaction = await ethereum.transferTo({
//         amount: firstAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const secondTransaction = await ethereum.transferTo({
//         amount: secondAmount,
//         toAddress: depositAddress,
//         privateKey: fundedAccount.privateKey,
//       })

//       const depositTransactions = await ethereum.getDepositTransactions(depositAddress, [])

//       expect(depositTransactions.length).to.eql(2)
//       expect(depositTransactions[0].txHash).to.eql(secondTransaction.txHash)
//       expect(depositTransactions[1].txHash).to.eql(firstTransaction.txHash)
//     })
//   })
// })
