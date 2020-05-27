import { Body, Controller, Patch, Request, Route, Security, Post } from 'tsoa'
import { findUserByEmail, findUserPhoneDetailsByUserId, createHashedPassword, changePinCode } from '../../../core'
import { OverloadedRequest } from '@abx-types/account'
import { updatePhoneDetailsbyUserId } from '../../../core'

interface UserDeviceRequest {
  email: string,
  uuidPhone: string,
  verificationCodePhone: number
}

interface SavePinRequest {
  pinCode: string
}
interface ChangePinCodeRequest {
  currentPinCode: string
  newPinCode: string
}

@Route('users')
export class UserDeviceManagementController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('device')
  public async savePinCodeUserDevice(@Request() request: OverloadedRequest, @Body() { pinCode }: SavePinRequest): Promise<{ message: string } | void> {
      try {
        const hashedPinCode = await createHashedPassword(pinCode)
        await updatePhoneDetailsbyUserId({ userId: request.user!.id, pinCodeHash: hashedPinCode })
      } catch (e) {
        this.setStatus(400)
        return { message: e.message }
      }
  }

  @Patch('device')
  public async updateDevice(@Body() { email, verificationCodePhone, uuidPhone }: UserDeviceRequest): Promise<{ message: string } | void> {
    try {
      const user = await findUserByEmail(email)

      if (!user){
        this.setStatus(404)
        return { message: 'User not found'}
      }

      const userPhoneDetails = await findUserPhoneDetailsByUserId(user.id)

      if (!userPhoneDetails){
        this.setStatus(404)
        return { message: 'Verification Code Phone not found'}
      }

      let verificationCodePhoneMatches: boolean = false
      if (verificationCodePhone){
        verificationCodePhoneMatches = verificationCodePhone === userPhoneDetails.verificationCodePhone
      }

      if (!verificationCodePhoneMatches){
        this.setStatus(400)
        return { message: 'Verification Code Phone is incorrect' }
      }
 
      await updatePhoneDetailsbyUserId({userId: user.id, uuidPhone: uuidPhone })
    } catch (e) {
      this.setStatus(400)
      return { message: e.message }
    }
  }
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Patch('device/pin')
  public async changePinCode(
    @Request() request: OverloadedRequest,
    @Body() { currentPinCode, newPinCode }: ChangePinCodeRequest,
  ): Promise<{ message: string } | void> {
    try {
      await changePinCode({
        userId: request.user!.id,
        currentPinCode,
        newPinCode,
      })
    } catch (error) {
      this.setStatus(400)
      return { message: error.message }
    }
  }
}