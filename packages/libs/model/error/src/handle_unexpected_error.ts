import { AbstractError } from './abstract_error'
const nr = require('newrelic')

// This occurs if we have a type error or something
// that we did not handle ourselves.
export function handleUnexpectedError(error) {
  if (!(error instanceof AbstractError)) {
    nr.recordMetric('UnexpectedError', 1)
    nr.noticeError(error)
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('!!!!!Unexpected Error!!!!!!')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log(error)
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!')
  }
}

process.on('uncaughtException', err => {
  console.error('Handling uncaught exception.')
  handleUnexpectedError(err)
  nr.shutdown({ collectPendingData: true }, nrError => {
    if (nrError) {
      console.error('error shutting down newrelic agent')
    }
    process.exit(1)
  })
})
