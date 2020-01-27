import jsreport from 'jsreport'

import { Logger } from '@abx-utils/logging'
import { EmailAttachment, EmailAttachmentType } from '@abx-types/notification'
import { ReportEngine, ReportRecipe } from '@abx-service-clients/report'
import { getTemplateFromS3, uploadReportToS3 } from './s3_helpers'
import { ReportRequest } from '@abx-service-clients/report'

const logger = Logger.getInstance('lib', 'createReportAndUploadToS3')

export async function createReportAndUploadToS3({ reportType, data }: ReportRequest): Promise<EmailAttachment[]> {
  try {
    logger.debug(`Generated report data for ${reportType}`)
    const template = await getTemplateFromS3(reportType)
    logger.debug(`Fetched report template for ${reportType}`)

    const renderedReport = await jsreport.render({
      template: {
        content: template,
        engine: ReportEngine.handlebars,
        recipe: ReportRecipe.phantomPdf,
        phantom: {
          customPhantomJS: true,
          footerHeight: '55px',
          footer: `<div style="display: block; border-top: 1px solid #a9a9a9; padding:2px">
            <div style="display: inline-block; width: 50%; text-align:left; float:left;" >
              <img style="max-height:36px;" src="{{footer.imgSrc}}"/>
            </div>
            <div style="display: inline-block; width: 50%; text-align: right;font-size: 9px;">
              <span style="display:block;"> {{footer.email}}</span>
            </div>
          </div>
          <div style="clear: both; display: block; width: 100%; text-align: center; font-size: 9px;">Page {#pageNum}/{#numPages}</div>`,
        },
      },
      data: data.content,
    })

    const { name } = await uploadReportToS3({
      reportBuffer: renderedReport.content,
      identifier: data.identifier,
      accountHin: data.content.account.hin,
      accountId: data.accountId,
      reportType,
    })

    const emailAttachment = [
      {
        name,
        content: renderedReport.content.toString('base64'),
        type: EmailAttachmentType.pdf,
      },
    ]

    return emailAttachment
  } catch (err) {
    return err
  }
}
