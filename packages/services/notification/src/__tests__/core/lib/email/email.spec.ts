import { expect } from 'chai'
import proxyquire from 'proxyquire'
import { getModel } from '@abx/db-connection-utils'
import { Email, NotificationStatus } from '@abx-types/notification'
import { createEmail } from '../../../../core'

describe('Notification Service', () => {
  describe('Email', () => {
    describe('createEmail', () => {
      const templateContent = {
        key1: 'value1',
        key2: 'value2',
      }

      it('saves email with provided params', async () => {
        const email: Email = {
          to: 'to@email.com',
          cc: 'cc@email.com',
          bcc: 'bcc@email.com',
          fromName: 'test from name',
          templateContent,
          templateName: 'testTemplate',
          subject: 'subject1',
        }

        const created = await createEmail(email)

        expect(created.to).to.equal(email.to)
        expect(created.cc).to.equal(email.cc)
        expect(created.bcc).to.equal(email.bcc)
        expect(created.fromName).to.equal(email.fromName)
        expect(created.subject).to.equal(email.subject)
        expect(created.templateName).to.equal(email.templateName)
        expect(created.templateContent).to.deep.equal(email.templateContent)
        expect(created.notificationStatus).to.equal(NotificationStatus.failed)
      })

      it('saves email with provided attachments', async () => {
        const txtAttachment = {
          name: 'Attachment1.txt',
          content: 'text content',
          type: 'application/pdf',
        }
        const pdfAttachment = {
          name: 'Attachment12.txt',
          content: 'PDF content',
          type: 'text',
        }

        const attachments = [txtAttachment, pdfAttachment]

        const email: Email = {
          to: 'to@email.com',
          templateContent,
          templateName: 'templateName',
          subject: 'subject',
        }

        const created = await createEmail({ ...email, attachments: attachments as any[] })

        expect(created.attachments!.length).to.equal(2)
        expect(created.attachments!.map(a => [a.name, a.content])).to.deep.members(attachments.map(a => [a.name, a.content]))
      })

      it('saves email with notification status and result as received from mandrill API', async () => {
        const email: Email = {
          to: 'to@email.com',
          templateContent,
          templateName: 'templateName',
          subject: 'subject',
        }

        const mandrillResult = { mandrill: 'result', anyOtherMandrill: 'data' }

        const { createEmail: create } = proxyquire('../../../../core/lib/email', {
          './mandrill': {
            sendEmail: async () => ({
              mandrillResult,
              notificationStatus: 'whatever mandrill says',
            }),
          },
        })

        const created: Email = await create(email)

        expect(created.notificationStatus).to.equal('whatever mandrill says')
        expect(created.mandrillResult).to.deep.equal(mandrillResult)
      })

      it('Saves email before attempting to send', async () => {
        const mandrillError = 'Mandrill API error'
        const email: Email = {
          to: 'to@email.com',
          templateContent: {
            saved: 'value',
          },
          templateName: 'templateName',
          subject: 'saved subject',
        }

        const { createEmail: create } = proxyquire('../../../../core/lib/email', {
          './mandrill': {
            sendEmail: async () => {
              throw new Error(mandrillError)
            },
          },
        })

        try {
          await create(email)

          throw new Error(`This shouldn't be called`)
        } catch (err) {
          expect(err.message).to.equal(mandrillError)

          const [savedEmail] = (await getModel<Email>('email').findAll()).map(e => e.get())

          expect(savedEmail.to).to.equal(email.to)
        }
      })
    })
  })
})
