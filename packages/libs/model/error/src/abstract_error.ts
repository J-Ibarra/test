import nr from 'newrelic'
import util from 'util'

/**
 * Custom Extendable Error Class - This class will be inherited by all error classes
 * raised by the exchange
 * @return Error Object
 */
export class AbstractError extends Error {
  public id: string
  public context: {}
  public status: {}
  public severity: number

  constructor(
    name: string,
    message: string,
    meta: {
      context?: {}
      args?: any
      severity: number
      status?: number
      id?: string
    },
  ) {
    super(message)
    this.id = meta.id || (Math.random() * 100000).toFixed(0)
    this.name = name
    this.context = meta.context as any
    this.stack = (new Error() as any).stack
    this.status = meta.status as any
    this.severity = meta.severity
    nr.recordMetric(name, 1)
    nr.noticeError(this)

    const msg = `${this.name}. ID: ${this.id} Severity: ${meta.severity}.
      Message: ${this.message}. Stack: ${this.stack}
      Context: ${util.inspect(this.context, false, null)}. Args: ${meta.args}`

    if (process.env.NODE_ENV !== 'test') {
      if (this.severity === 1) {
        console.log(msg)
      } else if (this.severity === 2) {
        console.warn(msg)
      } else {
        console.error(msg)
      }
    }
  }

  public toString() {
    return this.name + ': ' + this.message
  }
}
