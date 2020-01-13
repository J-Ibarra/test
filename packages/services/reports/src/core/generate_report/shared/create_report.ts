const jsreport = require('jsreport')

import { Logger } from '../../../../config/logging'
import { EmailAttachment, EmailAttachmentType } from '../../../../notification/interfaces'
import { ReportEngine, ReportRecipe, ReportRequestData } from '../../../interfaces'
import { generateReportData } from './report_helpers'
import { getTemplateFromS3, uploadReportToS3 } from './s3_helpers'


const logger = Logger.getInstance('lib', 'createReportAndUploadToS3')

export async function createReportAndUploadToS3(
  request: ReportRequestData,
): Promise<EmailAttachment[]> {
  try {
    const { data, identifier, accountId } = await generateReportData(request)
    logger.debug(`Generated report data for ${request.reportType}`)
    const template = await getTemplateFromS3(request.reportType)
    logger.debug(`Fetched report template for ${request.reportType}`)

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
          <div style="clear: both; display: block; width: 100%; text-align: center; font-size: 9px;">Page {#pageNum}/{#numPages}</div>`
        }
      },
      data
    })

    const { name } = await uploadReportToS3({
      reportBuffer: renderedReport.content,
      identifier,
      reportType: request.reportType,
      accountHin: data.account.hin,
      accountId
    })

    const emailAttachment = [{
      name,
      content: renderedReport.content.toString('base64'),
      type: EmailAttachmentType.pdf,
    }]

    return emailAttachment
  } catch (err) {
    return err
  }
}
