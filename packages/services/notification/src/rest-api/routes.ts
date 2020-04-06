/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { E2eTestingDataSetupController } from './E2eTestingController';
import * as express from 'express';

const models: TsoaRoute.Models = {
  "EmailTemplates": {
    "enums": ["Kinesis Money Welcome Email", "Kinesis Money Verify Email Resend", "Kinesis Money Referral Link Email", "Kinesis Money Account Suspension", "Kinesis Money Account Reactivation", "Kinesis Money Withdrawal Request", "Kinesis Money Crypto Withdraw Success", "Kinesis Money Reset Password Request", "Kinesis Money Password Reset Confirmation", "Kinesis Money Trade Confirmation v2", "Kinesis Money Deposit Success", "Kinesis Money Suspended Account Crypto Deposit"],
  },
  "EmailCheckRequestBody": {
    "properties": {
      "email": { "dataType": "string", "required": true },
      "template": { "ref": "EmailTemplates", "required": true },
      "from": { "dataType": "string" },
    },
  },
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
  app.post('/api/test-automation/emails/sent/check',
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "body", "required": true, "ref": "EmailCheckRequestBody" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.checkEmailSent.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/test-automation/emails/sent/count',
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "body", "required": true, "ref": "EmailCheckRequestBody" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.getEmailsSentCount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });


  function isController(object: any): object is Controller {
    return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
  }

  function promiseHandler(controllerObj: any, promise: any, response: any, next: any) {
    return Promise.resolve(promise)
      .then((data: any) => {
        let statusCode;
        if (isController(controllerObj)) {
          const headers = controllerObj.getHeaders();
          Object.keys(headers).forEach((name: string) => {
            response.set(name, headers[name]);
          });

          statusCode = controllerObj.getStatus();
        }

        if (data || data === false) { // === false allows boolean result
          response.status(statusCode || 200).json(data);
        } else {
          response.status(statusCode || 204).end();
        }
      })
      .catch((error: any) => next(error));
  }

  function getValidatedArgs(args: any, request: any): any[] {
    const fieldErrors: FieldErrors = {};
    const values = Object.keys(args).map((key) => {
      const name = args[key].name;
      switch (args[key].in) {
        case 'request':
          return request;
        case 'query':
          return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors);
        case 'path':
          return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors);
        case 'header':
          return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors);
        case 'body':
          return validationService.ValidateParam(args[key], request.body, name, fieldErrors, name + '.');
        case 'body-prop':
          return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, 'body.');
      }
    });
    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidateError(fieldErrors, '');
    }
    return values;
  }
}
