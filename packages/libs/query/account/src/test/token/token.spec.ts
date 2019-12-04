import { expect } from 'chai'
import { v4 } from 'node-uuid'
import sinon from 'sinon'
import sequelize, { getModel } from '../../../db/abx_modules'
import { createTemporaryTestingAccount } from '../../../db/test_helpers/test_accounts'
import { Token } from '../../interface'
import { JwtTokenHandler } from '../../lib/token/jwt_token_handler'
import { createTokenForAccount, deactivateToken, findToken, findTokensForAccount } from '../../lib/token/token'

const testAuthToken = {
  token: 'foo',
  metadata: {
    expiry: new Date(),
  },
}

const testTokenHandler: JwtTokenHandler = {
  generateToken: () => testAuthToken,
  verifyToken: () => ({
    success: true,
  }),
}

describe('token', () => {
  afterEach(() => {
    sinon.restore()
  })

  it('createTokenForAccount creates a token for account', async () => {
    const account = await createTemporaryTestingAccount()
    const generateTokenSpy = sinon.spy(testTokenHandler, 'generateToken')

    const token = await createTokenForAccount(account.id, testTokenHandler)

    const tokenCreated = await findToken(token.id)

    expect(generateTokenSpy.withArgs(account.id).calledOnce).to.equal(true)

    expect(tokenCreated.accountId).to.eql(account.id)
    expect(tokenCreated.deactivated).to.equal(false)
    expect(tokenCreated.token).to.eql(testAuthToken.token)
  })

  describe('findToken', () => {
    it('gets token with id', async () => {
      const account = await createTemporaryTestingAccount()

      return sequelize.transaction(async transaction => {
        const token = {
          id: v4(),
          accountId: account.id,
          token: 'dummy token',
          deactivated: false,
          expiry: new Date(),
        }

        await getModel<Token>('token').create(token, { transaction })

        const fetchedToken = await findToken(token.id)

        expect(fetchedToken).to.eql(fetchedToken)
      })
    })

    it('returns null if no token found', async () => {
      const tokenId = v4()

      const token = await findToken(tokenId)

      expect(token).to.equal(null)
    })
  })

  describe('findTokensForAccount', () => {
    it('returns tokens for account', async () => {
      const account = await createTemporaryTestingAccount()

      const tokens = [
        {
          id: v4(),
          accountId: account.id,
          token: 'test token 1',
          deactivated: false,
          expiry: new Date(),
        },
        {
          id: v4(),
          accountId: account.id,
          token: 'test token 2',
          deactivated: false,
          expiry: new Date(),
        },
      ]

      await Promise.all(tokens.map(token => getModel<Token>('token').create(token)))

      const foundTokens = await findTokensForAccount(account.id)

      expect(foundTokens.length).to.equal(2)
      expect(foundTokens.map(({ token }) => token)).to.members(['test token 1', 'test token 2'])
    })

    it('returns empty array if no tokens found for account', async () => {
      const account = await createTemporaryTestingAccount()

      const tokens = await findTokensForAccount(account.id)

      expect(tokens).to.deep.equal([])
    })
  })

  it('deactivateToken flags the token instance as deactivated', async () => {
    const account = await createTemporaryTestingAccount()

    return sequelize.transaction(async transaction => {
      const tokenId = v4()
      await getModel<Token>('token').create(
        {
          id: tokenId,
          accountId: account.id,
          token: 'dummy token',
          deactivated: false,
          expiry: new Date(),
        },
        {
          transaction,
        },
      )

      await deactivateToken(tokenId, account.id, transaction)

      const deactivatedToken = await findToken(tokenId)

      expect(deactivatedToken).to.equal(null)
    })
  })
})
