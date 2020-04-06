/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { AccountSummaryController } from './account_summary_controller';
import { AdminRequestsController } from './admin_requests_controller';
import { E2eTestingController } from './E2eTestingController';
import { expressAuthentication } from './middleware/authentication';
import * as express from 'express';

const models: TsoaRoute.Models = {
  "AdminRequestType": {
    "enums": ["withdrawal", "deposit", "redemption"],
  },
  "CurrencyCode": {
    "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"],
  },
  "AdminRequestStatus": {
    "enums": ["pending", "approved", "rejected"],
  },
  "AdminRequest": {
    "properties": {
      "client": { "dataType": "string", "required": true },
      "hin": { "dataType": "string", "required": true },
      "type": { "ref": "AdminRequestType", "required": true },
      "description": { "dataType": "string" },
      "asset": { "ref": "CurrencyCode", "required": true },
      "amount": { "dataType": "double", "required": true },
      "admin": { "dataType": "string", "required": true },
      "status": { "ref": "AdminRequestStatus", "required": true },
      "fee": { "dataType": "double" },
      "id": { "dataType": "double", "required": true },
      "globalTransactionId": { "dataType": "string", "required": true },
      "createdAt": { "dataType": "datetime", "required": true },
      "updatedAt": { "dataType": "datetime", "required": true },
      "tradingPlatformName": { "dataType": "string", "required": true },
    },
  },
  "AdminRequestStatusUpdateParams": {
    "properties": {
      "status": { "ref": "AdminRequestStatus", "required": true },
      "updatedAt": { "dataType": "datetime", "required": true },
    },
  },
  "AdminRequestParams": {
    "properties": {
      "hin": { "dataType": "string", "required": true },
      "type": { "ref": "AdminRequestType", "required": true },
      "description": { "dataType": "string" },
      "asset": { "ref": "CurrencyCode", "required": true },
      "amount": { "dataType": "double", "required": true },
      "fee": { "dataType": "double" },
    },
  },
  "CreateAdminRequestParams": {
    "properties": {
      "client": { "dataType": "string", "required": true },
      "hin": { "dataType": "string", "required": true },
      "type": { "ref": "AdminRequestType", "required": true },
      "description": { "dataType": "string" },
      "asset": { "ref": "CurrencyCode", "required": true },
      "amount": { "dataType": "double", "required": true },
      "admin": { "dataType": "string", "required": true },
      "status": { "ref": "AdminRequestStatus", "required": true },
      "fee": { "dataType": "double" },
    },
  },
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
  app.get('/api/admin/fund-management/account-summary/:accountHin',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        accountHin: { "in": "path", "name": "accountHin", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AccountSummaryController();


      const promise = controller.getAccountSummaryForHin.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/admin/fund-management/admin-requests',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AdminRequestsController();


      const promise = controller.retrieveAllAdminRequests.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/admin/fund-management/admin-requests/:accountHin',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        accountHin: { "in": "path", "name": "accountHin", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AdminRequestsController();


      const promise = controller.getAdminRequestsForAccountHin.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/admin/fund-management/admin-requests/:id',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
        undefined: { "in": "body", "required": true, "ref": "AdminRequestStatusUpdateParams" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AdminRequestsController();


      const promise = controller.updateAdminRequestStatus.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/admin/fund-management/admin-requests',
    authenticateMiddleware([{ "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        requestBody: { "in": "body", "name": "requestBody", "required": true, "ref": "AdminRequestParams" },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AdminRequestsController();


      const promise = controller.createAdminRequest.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/test-automation/admin/fund-management/admin-request',
    function(request: any, response: any, next: any) {
      const args = {
        adminRequest: { "in": "body", "name": "adminRequest", "required": true, "ref": "CreateAdminRequestParams" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingController();


      const promise = controller.saveAdminRequest.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.delete('/api/test-automation/admin/fund-management/admin-request/:email',
    function(request: any, response: any, next: any) {
      const args = {
        email: { "in": "path", "name": "email", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingController();


      const promise = controller.deleteAllAdminRequest.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });

  function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
    return (request: any, _response: any, next: any) => {
      let responded = 0;
      let success = false;

      const succeed = function(user: any) {
        if (!success) {
          success = true;
          responded++;
          request['user'] = user;
          next();
        }
      }

      const fail = function(error: any) {
        responded++;
        if (responded == security.length && !success) {
          error.status = 401;
          next(error)
        }
      }

      for (const secMethod of security) {
        if (Object.keys(secMethod).length > 1) {
          let promises: Promise<any>[] = [];

          for (const name in secMethod) {
            promises.push(expressAuthentication(request, name, secMethod[name]));
          }

          Promise.all(promises)
            .then((users) => { succeed(users[0]); })
            .catch(fail);
        } else {
          for (const name in secMethod) {
            expressAuthentication(request, name, secMethod[name])
              .then(succeed)
              .catch(fail);
          }
        }
      }
    }
  }

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
