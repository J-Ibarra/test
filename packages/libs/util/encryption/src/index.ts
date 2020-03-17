import AWS from 'aws-sdk'
import { Environment, localAndTestEnvironments, getAwsRegionForEnvironment } from '@abx-types/reference-data'

const kms = new AWS.KMS({ region: getAwsRegionForEnvironment(process.env.NODE_ENV as Environment) })

const environmentsWithoutKMSEncryption = localAndTestEnvironments

export async function decryptValue(key: string) {
  // Dont decrypt when testing
  // This is because the key isn't encrypted in the first case,
  // So we just return the key
  if (
    process.env.NODE_ENV!.startsWith('test') ||
    environmentsWithoutKMSEncryption.includes(process.env.NODE_ENV as Environment) ||
    isStringAndEmpty(key)
  ) {
    return key
  }

  if (!key || typeof key !== 'string') {
    return
  }

  const params = {
    CiphertextBlob: Buffer.from(key, 'base64'),
  }

  const decryptPayload = await kms.decrypt(params).promise()

  return (decryptPayload.Plaintext as Buffer).toString()
}

export async function encryptValue(key: string) {
  // Dont encrypt the key when testing
  // This avoids Travis having to interact with AWS, and
  // The 'Decrypt' function breaking when trying to decrypt junk
  if (
    process.env.NODE_ENV!.startsWith('test') ||
    environmentsWithoutKMSEncryption.includes(process.env.NODE_ENV as Environment) ||
    isStringAndEmpty(key)
  ) {
    return key
  }

  const params = {
    KeyId: process.env.KMS_KEY_ID!,
    //KeyId:'965d2884-b2ab-4e78-8773-6b1f57133300',
    Plaintext: Buffer.from(key),
  }

  const { CiphertextBlob } = await kms.encrypt(params).promise()
  return (CiphertextBlob as Buffer).toString('base64')
}

const isStringAndEmpty = (value: string) => typeof value === 'string' && !value
