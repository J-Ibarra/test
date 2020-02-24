import { expect } from 'chai'
import { wrapInTransaction, sequelize, truncateTables } from '@abx-utils/db-connection-utils'
import { CurrencyCode, FiatCurrency } from '@abx-types/reference-data'
import { WithdrawalRequest, WithdrawalRequestType, WithdrawalState } from '@abx-types/withdrawal'
import { createWithdrawalRequest } from '../../lib'
import {
  createWithdrawalEmission,
  findWithdrawalEmission,
  getLatestWithdrawalEmissionSequenceNumber,
} from '../../lib/common/kinesis_coin_emission_operations'
import { createTemporaryTestingAccount } from '@abx-utils/account'

describe('Withdrawal Emissions', () => {
  let account
  let withdrawalRequest: WithdrawalRequest
  let withdrawalRequest2: WithdrawalRequest

  beforeEach(async () => {
    await truncateTables(['withdrawal_kinesis_coin_emission'])
    account = await createTemporaryTestingAccount()
    withdrawalRequest = await createWithdrawalRequest({
      amount: 1,
      state: WithdrawalState.completed,
      address: '1213x-xasdad1ddasdas',
      currencyId: 2,
      account,
      accountId: account.id,
      txHash: 'daxadasfa-fafa',
      fiatCurrencyCode: FiatCurrency.usd,
      fiatConversion: 123,
      kauConversion: 12,
      type: WithdrawalRequestType.withdrawal,
    })
    withdrawalRequest2 = await createWithdrawalRequest({
      amount: 2,
      state: WithdrawalState.completed,
      address: '1213x-xasdad1ddasdas',
      currencyId: 2,
      account,
      accountId: account.id,
      txHash: 'daxadasfa-fafa',
      fiatCurrencyCode: FiatCurrency.usd,
      fiatConversion: 1231,
      kauConversion: 12,
      type: WithdrawalRequestType.withdrawal,
    })
  })

  describe('findWithdrawalEmission', () => {
    it('Returns null if no record exists for given withdrawalRequestId', async function() {
      const emission = await findWithdrawalEmission(withdrawalRequest.id!)

      expect(emission).to.deep.equal(null)
    })

    it('Returns a withdrawal emission for given withdrawalRequestId', async function() {
      const created = (await wrapInTransaction(sequelize, null, async t =>
        createWithdrawalEmission(
          {
            currency: CurrencyCode.kau,
            withdrawalRequestId: withdrawalRequest.id!,
            sequence: '1',
            txEnvelope: 'txEnvelope',
          },
          t,
        ),
      ))!

      const emission = (await findWithdrawalEmission(withdrawalRequest.id!))!

      expect(emission.id).to.equal(created.id)
      expect(emission.withdrawalRequestId).to.equal(created.withdrawalRequestId)
      expect(emission.sequence).to.equal(created.sequence)
      expect(emission.txEnvelope).to.equal(created.txEnvelope)
      expect(emission.currency).to.equal(created.currency)
    })
  })

  describe('createWithdrawalEmission', () => {
    it('Returns existing withdrawal emission if already exists for given order match id', async function() {
      const sequence = '1'
      const txEnvelope = 'txEnvelope'

      const withdrawalEmission = (await wrapInTransaction(sequelize, null, async t =>
        createWithdrawalEmission(
          {
            currency: CurrencyCode.kau,
            withdrawalRequestId: withdrawalRequest.id!,
            sequence,
            txEnvelope,
          },
          t,
        ),
      ))!

      expect(withdrawalEmission.withdrawalRequestId).to.equal(withdrawalRequest.id)
      expect(withdrawalEmission.sequence).to.equal(sequence)
      expect(withdrawalEmission.txEnvelope).to.equal(txEnvelope)
      expect(withdrawalEmission.currency).to.equal(CurrencyCode.kau)

      const deDupedWithdrawalEmission = (await wrapInTransaction(sequelize, null, async t =>
        createWithdrawalEmission(
          {
            currency: CurrencyCode.kau,
            withdrawalRequestId: withdrawalRequest.id!,
            sequence: '2',
            txEnvelope: 'duplicateTxEnvelope',
          },
          t,
        ),
      ))!

      expect(deDupedWithdrawalEmission.id).to.equal(withdrawalEmission.id)
      expect(deDupedWithdrawalEmission.withdrawalRequestId).to.equal(withdrawalEmission.id)
      expect(deDupedWithdrawalEmission.sequence).to.equal(withdrawalEmission.sequence)
      expect(deDupedWithdrawalEmission.txEnvelope).to.equal(withdrawalEmission.txEnvelope)
      expect(deDupedWithdrawalEmission.currency).to.equal(withdrawalEmission.currency)
    })

    it('Throws error if more than one record attempted to be created for the same network and sequence', async function() {
      const sequence = '1'
      const txEnvelope = 'txEnvelope'
      const currency = CurrencyCode.kau

      await wrapInTransaction(sequelize, null, async t =>
        createWithdrawalEmission(
          {
            currency,
            withdrawalRequestId: withdrawalRequest.id!,
            sequence,
            txEnvelope,
          },
          t,
        ),
      )
      try {
        await wrapInTransaction(sequelize, null, async t =>
          createWithdrawalEmission(
            {
              currency,
              withdrawalRequestId: withdrawalRequest2.id!,
              sequence,
              txEnvelope: 'otherTxEnvelope',
            },
            t,
          ),
        )
        throw new Error('Wrong error for unique network_sequence validation')
      } catch (e) {
        expect(e.fields).to.deep.equal({
          currency,
          sequence: sequence.toString(),
        })
      }
    })
  })

  it('Creates a mint emission record', async function() {
    const sequence = '1'
    const txEnvelope = 'txEnvelope'
    const mintEmission = (await wrapInTransaction(sequelize, null, async t =>
      createWithdrawalEmission(
        {
          currency: CurrencyCode.kau,
          withdrawalRequestId: withdrawalRequest.id!,
          sequence,
          txEnvelope,
        },
        t,
      ),
    ))!
    expect(mintEmission.withdrawalRequestId).to.equal(withdrawalRequest.id)
    expect(mintEmission.sequence).to.equal(sequence)
    expect(mintEmission.txEnvelope).to.equal(txEnvelope)
    expect(mintEmission.currency).to.equal(CurrencyCode.kau)
  })

  it('Creates records with the same sequence if currency is different', async function() {
    const sequence = '1'
    const txEnvelope = 'txEnvelope'

    const kauWithdrawalEmission = (await wrapInTransaction(sequelize, null, async t =>
      createWithdrawalEmission(
        {
          currency: CurrencyCode.kau,
          withdrawalRequestId: withdrawalRequest.id!,
          sequence,
          txEnvelope,
        },
        t,
      ),
    ))!
    const kagWithdrawalRequest = (await wrapInTransaction(sequelize, null, async t =>
      createWithdrawalEmission(
        {
          currency: CurrencyCode.kag,
          withdrawalRequestId: withdrawalRequest2.id!,
          sequence,
          txEnvelope: 'otherTxEnvelope',
        },
        t,
      ),
    ))!
    expect(kauWithdrawalEmission.withdrawalRequestId).to.equal(withdrawalRequest.id)
    expect(kauWithdrawalEmission.sequence).to.equal(sequence)
    expect(kauWithdrawalEmission.txEnvelope).to.equal(txEnvelope)
    expect(kauWithdrawalEmission.currency).to.equal(CurrencyCode.kau)

    expect(kagWithdrawalRequest.withdrawalRequestId).to.equal(withdrawalRequest2.id)
    expect(kagWithdrawalRequest.sequence).to.equal(sequence)
    expect(kagWithdrawalRequest.txEnvelope).to.equal('otherTxEnvelope')
    expect(kagWithdrawalRequest.currency).to.equal(CurrencyCode.kag)
  })

  describe('getLatestWithdrawalEmissionSequenceNumber', () => {
    it('Default value is zero if no mint emission records exist', async function() {
      const largestSequenceNumber = await getLatestWithdrawalEmissionSequenceNumber(CurrencyCode.kau)

      expect(largestSequenceNumber).to.equal('0')
    })

    it('Returns the largest sequence number from all mint emissions for network', async function() {
      const emission1 = (await wrapInTransaction(sequelize, null, async t =>
        createWithdrawalEmission(
          {
            currency: CurrencyCode.kag,
            withdrawalRequestId: withdrawalRequest.id!,
            sequence: '1',
            txEnvelope: 'txEnvelope1',
          },
          t,
        ),
      ))!
      const emission2 = (await wrapInTransaction(sequelize, null, async t =>
        createWithdrawalEmission(
          {
            currency: CurrencyCode.kau,
            withdrawalRequestId: withdrawalRequest2.id!,
            sequence: '2',
            txEnvelope: 'txEnvelope2',
          },
          t,
        ),
      ))!
      const largestKAGSequenceNumber = await getLatestWithdrawalEmissionSequenceNumber(CurrencyCode.kag)
      const largestKAUSequenceNumber = await getLatestWithdrawalEmissionSequenceNumber(CurrencyCode.kau)

      expect(largestKAGSequenceNumber).to.equal(emission1.sequence)
      expect(largestKAUSequenceNumber).to.equal(emission2.sequence)
    }).timeout(60_0000)
  })
})
