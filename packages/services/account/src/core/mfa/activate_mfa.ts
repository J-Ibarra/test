import * as qrcode from 'qrcode'
import * as speakeasy from 'speakeasy'

import { findUserById, updateUser } from '../users'
import { ValidationError } from '@abx-types/error'
import { MFA } from './model'

export async function activateMfa(userId: string, email: string): Promise<Partial<MFA>> {
  const user = await findUserById(userId)
  const { mfaSecret } = user!
  if (mfaSecret) {
    throw new ValidationError('Multifactor authentication has already been set up')
  }

  let { mfaTempSecret, qrcodeUrl } = user!
  if (!mfaTempSecret) {
    const generatedSecretAndQRCode = await generateSecretAndQRCode(email)
    mfaTempSecret = generatedSecretAndQRCode.mfaTempSecret
    qrcodeUrl = generatedSecretAndQRCode.qrcodeUrl

    await updateUser({
      id: userId,
      mfaTempSecret,
      mfaTempSecretCreated: new Date(),
      qrcodeUrl,
    })
  }

  return {
    mfaTempSecret,
    qrcodeUrl,
    message: 'Multifactor authentication has been activated.',
  }
}

export async function generateSecretAndQRCode(email: string): Promise<Partial<MFA>> {
  const { base32, otpauth_url } = speakeasy.generateSecret({
    name: `KBE: ${email}`,
  })
  const generatedQrcodeUrl = await qrcode.toDataURL(otpauth_url)

  return {
    mfaTempSecret: base32,
    qrcodeUrl: generatedQrcodeUrl,
  }
}
