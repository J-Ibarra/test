import { EpicurusRequestChannel } from '../../../commons'
import { getInstance } from '../../../db/epicurus'
import { EmailAttachment } from '../../../notification/interfaces'
import { ReportRequestData } from '../../interfaces'

export function generateReportRequest(reportRequest: ReportRequestData): Promise<EmailAttachment[]> {
  const epicurus = getInstance()
  return epicurus.request(EpicurusRequestChannel.generateReport, reportRequest)
}
