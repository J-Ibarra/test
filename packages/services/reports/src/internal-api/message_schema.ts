export const report = {
  type: 'object',
  'x-persist-event': 'report generation',
  properties: {
    reportType: {
      type: 'string',
      required: true,
    },
    data: {
      type: 'object',
      required: true,
    },
  },
}
