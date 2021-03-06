/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { WithdrawalsController } from './withdrawal_controller';
import { CryptoController } from './address_validation_controller';
import { ContactsController } from './contacts_controller';
import { expressAuthentication } from './middleware/authentication';
import * as express from 'express';

const models: TsoaRoute.Models = {
  "CurrencyCode": {
    "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"],
  },
  "WithdrawalRequestParams": {
    "properties": {
      "address": { "dataType": "string" },
      "amount": { "dataType": "double", "required": true },
      "currencyCode": { "ref": "CurrencyCode", "required": true },
      "memo": { "dataType": "string" },
    },
  },
  "PartialCurrencyWithdrawalConfig": {
  },
  "ContactCreateRequest": {
    "properties": {
      "currency": { "ref": "CurrencyCode", "required": true },
      "name": { "dataType": "string", "required": true },
      "publicKey": { "dataType": "string", "required": true },
    },
  },
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
  app.post('/api/withdrawals',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        withdrawalParams: { "in": "body", "name": "withdrawalParams", "required": true, "ref": "WithdrawalRequestParams" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new WithdrawalsController();


      const promise = controller.initialiseWithdrawal.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/withdrawals/configs',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new WithdrawalsController();


      const promise = controller.getWithdrawalConfigs.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/withdrawals/configs/:currency',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        currency: { "in": "path", "name": "currency", "required": true, "dataType": "enum", "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"] },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new WithdrawalsController();


      const promise = controller.getWithdrawalConfigForCurrency.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/withdrawals/configs/:currency',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        currency: { "in": "path", "name": "currency", "required": true, "dataType": "enum", "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"] },
        updatedConfig: { "in": "body", "name": "updatedConfig", "required": true, "ref": "PartialCurrencyWithdrawalConfig" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new WithdrawalsController();


      const promise = controller.updateWithdrawalConfig.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/crypto/validate',
    authenticateMiddleware([{ "cookieAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        code: { "in": "query", "name": "code", "required": true, "dataType": "enum", "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"] },
        address: { "in": "query", "name": "address", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new CryptoController();


      const promise = controller.validateAddressForCrypto.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/contacts/:currencyCode',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        currencyCode: { "in": "path", "name": "currencyCode", "required": true, "dataType": "enum", "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"] },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new ContactsController();


      const promise = controller.retrieveContactsForCurrencyForAccount.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.post('/api/contacts',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        contactCreateRequest: { "in": "body", "name": "contactCreateRequest", "required": true, "ref": "ContactCreateRequest" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new ContactsController();


      const promise = controller.createContactForCurrencyForAccount.apply(controller, validatedArgs as any);
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
