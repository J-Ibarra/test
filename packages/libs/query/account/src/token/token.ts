import { v4 } from 'node-uuid'
import { Transaction } from 'sequelize'
import { Token } from '@abx-types/account'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'

import { TokenHandler } from './token_handler'

export function createTokenForAccount(accountId: string, tokenHandler: TokenHandler, t?: Transaction) {
  const { token, metadata } = tokenHandler.generateToken(accountId)

  return wrapInTransaction(sequelize, t, async transaction => {
    const persistedToken = await getModel<Token>('token').create(
      {
        id: v4(),
        accountId,
        token,
        deactivated: false,
        expiry: metadata.expiry,
      },
      {
        transaction,
      },
    )

    return persistedToken.get()
  })
}

export async function findTokensForAccount(accountId: string): Promise<Token[]> {
  const tokens = await getModel<Token>('token').findAll({ where: { accountId, deactivated: false } })

  return tokens.map(token => token.get())
}

export async function findToken(id: string): Promise<Token | null> {
  const token = await getModel<Token>('token').findOne({ where: { id, deactivated: false } })

  return !!token ? token.get() : null
}

export async function deactivateToken(tokenId: string, accountId: string, t?: Transaction) {
  return wrapInTransaction(sequelize, t, async transaction => {
    await getModel<Partial<Token>>('token').update(
      {
        deactivated: true,
      },
      {
        where: { id: tokenId, accountId },
        transaction,
        returning: true,
      },
    )
  })
}
