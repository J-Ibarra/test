import * as AWS from 'aws-sdk'

import { getAwsRegionForEnvironment, Environment } from '@abx-types/reference-data'
import { ReportType, S3SignedUrlParams, UploadFileToS3Success } from '@abx-service-clients/report'
import { storeReport } from '../../stored_reports/store_reports'

const s3 = new AWS.S3({
  signatureVersion: 'v4',
  region: getAwsRegionForEnvironment(process.env.NODE_ENV as Environment),
})

export interface UploadFileToS3Request {
  reportBuffer: Buffer
  reportType: ReportType
  identifier: number
  accountHin: string
  accountId: string
}

export async function uploadReportToS3({
  reportBuffer,
  reportType,
  identifier,
  accountHin,
  accountId,
}: UploadFileToS3Request): Promise<UploadFileToS3Success> {
  const reportFileName = `${reportType}_${accountHin}_${identifier}.pdf`

  const params: AWS.S3.Types.PutObjectRequest = {
    Bucket: `kbe-${reportType}`,
    Key: `${process.env.NODE_ENV}/${reportFileName}`,
    Body: reportBuffer,
    ACL: 'private',
    ContentType: 'application/pdf',
  }

  try {
    const { ETag } = await s3.upload(params).promise()
    await storeReport({
      accountId,
      reportType,
      s3Key: ETag,
    })

    return {
      name: `${reportFileName}`,
    }
  } catch (err) {
    return err
  }
}

export async function getTemplateFromS3(template: ReportType): Promise<string> {
  const params: AWS.S3.GetObjectRequest = {
    Bucket: 'kbe-report-templates',
    Key: `templates/${template}.html`,
  }

  try {
    const { Body } = await s3.getObject(params).promise()
    return (Body as Buffer).toString()
  } catch (err) {
    return err.message
  }
}

export function createSignedUrl(params: S3SignedUrlParams): Promise<string> {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', params, (err: Error, url: string) => {
      if (err) {
        reject(err)
      }
      resolve(url)
    })
  })
}

export function listObjectMetaData(params: AWS.S3.Types.ListObjectsV2Request): Promise<AWS.S3.Types.ListObjectsV2Output> {
  return new Promise((res, rej) => {
    s3.listObjectsV2(params, (err, response) => {
      if (err) {
        rej(err)
      }
      res(response)
    })
  })
}

export function deleteObject(params: AWS.S3.Types.DeleteObjectRequest): Promise<AWS.S3.Types.DeleteObjectOutput> {
  return new Promise((res, rej) => {
    s3.deleteObject(params, (err, response) => {
      if (err) {
        rej(err)
      }
      res(response)
    })
  })
}

export async function deleteObjectsFromBucket(bucket: string) {
  const objectList = await listObjectMetaData({
    Bucket: bucket,
  })

  await Promise.all(
    objectList.Contents!.map(object => {
      return deleteObject({
        Bucket: bucket,
        Key: object.Key!,
      })
    }),
  )
}
