import * as _ from 'lodash'
const validate = require('jsonschema').validate
const nr = require('newrelic')

import { Logger } from '@abx-utils/logging'
import { handleUnexpectedError, ValidationError } from '@abx-types/error'
import { createExchangeEvent } from './exchange_event_operations'
import { ExchangeEvents } from './exchange_event.model'

type HandlerFn = (pickedMessage: any, t?: any) => Promise<any>

const logger = Logger.getInstance('message_schema', 'messageFactory')

export function messageFactory(schemaLogic: any, handlerFn: HandlerFn) {
  return (msg: any, respond?: (err: any, response?: any) => void) => {
    return new Promise((res, rej) => {
      let pickedMessage: any = msg
      const newRelicTransactionName = msg.role && msg.cmd ? msg.role + ':' + msg.cmd : msg.channel
      const transaction = nr.createWebTransaction(newRelicTransactionName, () => {
        let schema = schemaLogic
        if (_.isFunction(schemaLogic)) {
          // Useful when dynamically selecting a schema
          schema = schemaLogic(msg)
        }

        const validProps = schema.properties ? Object.keys(schema.properties) : []
        pickedMessage = _.pick(msg, validProps)

        jsonSchemaValidation(pickedMessage, schema)
          .then(() => handlerFn(pickedMessage))
          .then(results => {
            nr.endTransaction()
            // TODO this has performance implications, should rather write that to a queue and let it be persisted by a different process
            process.nextTick(() => writeExchangeEvents(msg, schema, createExchangeEvent))
            if (respond) {
              respond(null, results) // callback style
            } else {
              return res(results) // promise style
            }
          })
          .catch(error => {
            handleUnexpectedError(error)
            handleLoggingOfMessages(error, msg)
            nr.endTransaction()
            if (respond) {
              respond(error) // callback style
            } else {
              logger.error(error)
              rej(error) // promise style
            }
          })
      })
      transaction()
    })
  }
}

export function handleLoggingOfMessages(error, msg) {
  const errMsg = `Error Name: ${error.name}, Error Id: ${error.id}, Message: ${JSON.stringify(msg)}`

  if (_.isUndefined(error.severity) || error.severity === 1) {
    console.log(errMsg)
  } else {
    console.warn(errMsg)
  }
}

export async function jsonSchemaValidation(pickedMessage, schema) {
  const validationResults = validate(pickedMessage, schema)
  return validationResults.throwError ? customJsonSchemaErrors(validationResults.errors) : true
}

export function customJsonSchemaErrors(errors: any[]) {
  let generateErrorMessages = errors
    .map(error => {
      // error.stack is jsonSchema's error message.
      return _.get(error, 'schema.description', error.stack)
    })
    .join('. ')
  generateErrorMessages += '.'
  throw new ValidationError(generateErrorMessages, {
    context: {
      errors,
    },
  })
}

export async function writeExchangeEvents(msg: any, schema: any, eventFn: (event: ExchangeEvents) => Promise<any>) {
  if (!(msg && Object.keys(msg).length && schema)) {
    return
  }

  const persistExchangeEvent = schema['x-persist-event']
  if (persistExchangeEvent) {
    return eventFn({
      event: msg,
      eventName: persistExchangeEvent,
    })
  }

  return
}
