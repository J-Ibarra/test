import { Request } from 'express'
import { WhereOptions } from 'sequelize'
import { User, Session } from '../user'
import { Account } from '../account'

export interface OverloadedRequest extends Request {
  session: Session
  account: Account | null
  user: User
  where?: WhereOptions
}
