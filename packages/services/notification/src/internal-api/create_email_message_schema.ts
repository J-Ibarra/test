export const email = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      required: false,
    },
    to: {
      type: 'string',
      required: true,
    },
    cc: {
      type: 'string',
      required: false,
    },
    bcc: {
      type: 'string',
      required: false,
    },
    fromName: {
      type: 'string',
      required: false,
    },
    templateContent: {
      type: 'object',
      required: true,
    },
    templateName: {
      type: 'string',
      required: true,
    },
    subject: {
      type: 'string',
      required: true,
    },
    attachments: {
      type: 'array',
      required: false,
    },
  },
}
