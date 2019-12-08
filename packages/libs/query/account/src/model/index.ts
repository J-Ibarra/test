import { Sequelize } from 'sequelize'

import Account from './account'
import Session from './session'
import Token from './token'
import User from './user'

export default function accountModels(sequelize: Sequelize): any {
  const userModel = User(sequelize)
  const accountModel = Account(sequelize)
  const sessionModel = Session(sequelize)
  const tokenModel = Token(sequelize)

  accountModel.hasMany(userModel)
  userModel.belongsTo(accountModel)
  tokenModel.belongsTo(accountModel)

  return {
    account: accountModel,
    user: userModel,
    session: sessionModel,
    token: tokenModel,
  }
}
