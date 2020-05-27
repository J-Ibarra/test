import { UserPhoneDetails } from '@abx-types/account'
import { ValidationError } from '@abx-types/error'
import { Transaction } from 'sequelize'
import { UserPhoneDetailsInstance } from '../models/user-phone-details'
import { Logger } from '@abx-utils/logging'
import { createHashedPassword, validatePassword } from '.'
import { v4 } from 'node-uuid'
import { getModel, sequelize, wrapInTransaction } from '@abx-utils/db-connection-utils'
const logger = Logger.getInstance('account', 'user_controller')
logger.debug(`debug ${logger}`)

export async function findUserPhoneDetailsByUserId(userId: string, trans?: Transaction) {
    return wrapInTransaction(sequelize, trans, async t => {
      const user = await getModel<UserPhoneDetails>('user_phone_details').findOne({ where: { userId }, transaction: t })
      return user ? user.get() : null
    })
  }

export async function updatePhoneDetailsbyUserId(request: Partial<UserPhoneDetails>, t?: Transaction): Promise<[number, UserPhoneDetailsInstance[]]> {
    return wrapInTransaction(sequelize, t, async transaction => {
      return (await getModel<UserPhoneDetails>('user_phone_details').update(request as UserPhoneDetails, {
        where: { userId: request.userId } as any,
        transaction,
        returning: true,
      })) as any
    })
  }

export async function changePinCode({ userId, currentPinCode, newPinCode }): Promise<{ message: string } | void> {
    const userPhoneDetails = await findUserPhoneDetailsByUserId(userId)
    const pinCodeHash:string | any = userPhoneDetails?.pinCodeHash
    const isCurrentPinCodeValid = await validatePassword(currentPinCode, pinCodeHash)
    const hashedPinCode = await createHashedPassword(newPinCode)
    
    if (!isCurrentPinCodeValid){
      throw new ValidationError('The current Back-up PIN code you entered does not match our records')
    }
    
    await updatePhoneDetailsbyUserId({ userId, pinCodeHash: hashedPinCode })
  }
export async function validateUserPhone(userId: string, uuidPhone: string){ 
  const user = await findUserPhoneDetailsByUserId(userId)
  return user && user.uuidPhone === uuidPhone ? true : false
}

export async function updateUserPhoneDetails(request: Partial<UserPhoneDetails>, t?: Transaction): Promise<[number, UserPhoneDetailsInstance[]]> {
  return wrapInTransaction(sequelize, t, async transaction => {
    return (await getModel<UserPhoneDetails>('user_phone_details').update(request as UserPhoneDetails, {
      where: { userId: request.userId } as any,
      transaction,
      returning: true,
    })) as any
  })
}

function createUserPhoneDetails(userId: string, verificationCodePhone: number,  trans?: Transaction) {
  return wrapInTransaction(sequelize, trans, async t => {    
    return await getModel<UserPhoneDetails>('user_phone_details').create(
      {
        id: v4(),
        userId,
        verificationCodePhone,
      },
      {
        transaction: t,
      },
    )
  })
}

export async function saveVerificationCodePhone(userId: string, verificationCodePhone: number){ 
  const user = await findUserPhoneDetailsByUserId(userId)
  if (user){
    await updateUserPhoneDetails({userId: userId, verificationCodePhone: verificationCodePhone })
  }else{
    await createUserPhoneDetails(userId, verificationCodePhone)
  }
  
}




