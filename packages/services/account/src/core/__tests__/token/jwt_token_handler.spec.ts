import { expect } from 'chai'
import * as jwt from 'jsonwebtoken'
import moment from 'moment'

import { getEnvironmentConfig } from '@abx-utils/db-connection-utils'
import { JWT_GENERATION_CONFIG, JwtTokenHandler } from '../..'

const testAccountId = 'accountId'

describe('JwtTokenHandler', () => {
  const jwtTokenHandler = new JwtTokenHandler()

  it('generateToken generates a valid JWT', () => {
    const { token } = jwtTokenHandler.generateToken(testAccountId)

    // tslint:disable-next-line:no-unused-expression
    expect(token).to.not.be.undefined
    const decodedToken = jwt.verify(token, getEnvironmentConfig().jwtSecret)

    // tslint:disable-next-line:no-unused-expression
    expect(decodedToken).to.not.be.null
  })

  it('verifyToken returns a success TokenVerificationResult when token valid', () => {
    const token = jwt.sign({ accountId: testAccountId }, getEnvironmentConfig().jwtSecret)

    const verificationResult = jwtTokenHandler.verifyToken(token)
    // tslint:disable-next-line:no-unused-expression
    expect(verificationResult.success).to.be.true
    expect(verificationResult.claims!.accountId).to.eql(testAccountId)
  })

  it('verifyToken returns the error TokenVerificationResult when token validation fails(expired token)', () => {
    const token = jwt.sign(
      {
        accountId: testAccountId,
        iat: moment().unix(),
        exp: moment()
          .subtract(1, 'months')
          .unix(),
      },
      getEnvironmentConfig().jwtSecret,
      JWT_GENERATION_CONFIG,
    )

    const verificationResult = jwtTokenHandler.verifyToken(token)

    // tslint:disable-next-line:no-unused-expression
    expect(verificationResult.success).to.be.false
    expect(verificationResult.error!.type).to.eql('TokenExpiredError')
    expect(verificationResult.error!.message).to.eql('jwt expired')
  })
})
