export interface MFA {
  mfaSecret: string
  qrcodeUrl: string
  mfaTempSecret: string
  message: string
  mfaTempSecretCreated: Date
}
