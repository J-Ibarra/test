import { Body, Controller, Delete, Get, Post, Request, Response, Route, Security, SuccessResponse } from 'tsoa'
import { validateUserCredentials, JwtTokenHandler, createTokenForAccount, deactivateToken, findToken, findTokensForAccount } from '../../../core'
import { ValidationError } from '@abx-types/error'
import { OverloadedRequest } from '@abx-types/account'

export interface TokenResponse {
  id: string
  token: string
}

export interface TokenRequest {
  email: string
  password: string
}

@Route('tokens')
export class TokensController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get()
  public async getTokens(@Request() request: OverloadedRequest): Promise<TokenResponse[]> {
    const accountTokens = await findTokensForAccount(request.account!.id)

    return accountTokens.map(({ id, token }) => ({ id, token }))
  }

  @SuccessResponse('201', 'Created')
  @Response('400', 'Bad request')
  @Post()
  public async createToken(@Body() requestBody: TokenRequest) {
    const { email, password } = requestBody
    try {
      const user = await validateUserCredentials(email, password)

      const { id, token } = await createTokenForAccount(user.accountId, new JwtTokenHandler())

      this.setStatus(201)

      return { id, token }
    } catch (err) {
      if (err instanceof ValidationError) {
        this.setStatus(400)
        return { message: 'Email and/or password are incorrect' }
      }

      this.setStatus(err.status || 400)

      return {
        message: err.message,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @SuccessResponse('204', 'No Body')
  @Delete('{id}')
  public async removeToken(id: string, @Request() request: OverloadedRequest) {
    const accountId = request.account!.id

    try {
      const token = await findToken(id)

      if (!token) {
        this.setStatus(400)
      } else if (token.accountId !== accountId) {
        this.setStatus(403)
      } else {
        await deactivateToken(id, request.account!.id)
        this.setStatus(204)
      }
    } catch ({ status }) {
      this.setStatus(status || 400)
    }
  }
}
