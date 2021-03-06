/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { BoundariesController } from './boundaries_controller';
import { CurrenciesController } from './currencies_controller';
import { FeatureFlagsController } from './feature_flags_controller';
import { SymbolsController } from './symbols_controller';
import { E2eTestingDataSetupController } from './E2eTestingDataSetupController';
import { AdminSymbolsController } from './symbols_admin_controller';
import { ExchangeConfigController } from './exchange_config_contoller';
import { expressAuthentication } from './middleware/authentication';
import * as express from 'express';

const models: TsoaRoute.Models = {
  "Record": {
  },
  "CurrencyCode": {
    "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"],
  },
  "Currency": {
    "properties": {
      "id": { "dataType": "double", "required": true },
      "code": { "ref": "CurrencyCode", "required": true },
      "symbolSortPriority": { "dataType": "double" },
      "currencyOrderPriority": { "dataType": "double" },
      "isEnabled": { "dataType": "boolean" },
    },
  },
  "SupportedFeatureFlags": {
    "enums": ["debit_card", "BTC", "TETHER", "BTC_KAU", "BTC_KAG", "ETH_BTC", "BTC_USD", "BTC_EUR", "BTC_GBP", "KVT_BTC", "KVT_USDT", "KAU_USDT", "KAG_USDT", "ETH_USDT", "BTC_USDT", "USDT_EUR", "USDT_USD"],
  },
  "FeatureFlag": {
    "properties": {
      "name": { "ref": "SupportedFeatureFlags", "required": true },
      "enabled": { "dataType": "object", "required": true },
    },
  },
  "SymbolPairApiResponse": {
    "properties": {
      "id": { "dataType": "string", "required": true },
      "base": { "ref": "CurrencyCode", "required": true },
      "quote": { "ref": "CurrencyCode", "required": true },
      "fee": { "ref": "CurrencyCode", "required": true },
      "orderRange": { "dataType": "object" },
      "sortOrder": { "dataType": "object" },
    },
  },
  "MobileVersions": {
    "properties": {
      "ios": { "dataType": "string", "required": true },
      "android": { "dataType": "string", "required": true },
      "forceVersionUpdate": { "dataType": "boolean", "required": true },
    },
  },
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
  app.get('/api/boundaries',
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new BoundariesController();


      const promise = controller.findAllBoundaries.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/currencies',
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        includeExtendedDetails: { "in": "query", "name": "includeExtendedDetails", "dataType": "boolean" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new CurrenciesController();


      const promise = controller.getCurrencies.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/feature-flags',
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

      const controller = new FeatureFlagsController();


      const promise = controller.retrieveAllFeatureFlags.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/symbols',
    function(request: any, response: any, next: any) {
      const args = {
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
        includeOrderRange: { "in": "query", "name": "includeOrderRange", "dataType": "boolean" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new SymbolsController();


      const promise = controller.getSymbols.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/symbols/apply-threshold',
    authenticateMiddleware([{ "tokenAuth": [] }, { "cookieAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        undefined: { "in": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new SymbolsController();


      const promise = controller.getApplySymbolsThresholdStatus.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/test-automation/feature-flags',
    function(request: any, response: any, next: any) {
      const args = {
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.getFeatureFlags.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/test-automation/feature-flags',
    function(request: any, response: any, next: any) {
      const args = {
        body: { "in": "body", "name": "body", "required": true, "dataType": "any" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.updateFeatureFlags.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/test-automation/currencies/status',
    function(request: any, response: any, next: any) {
      const args = {
        body: { "in": "body", "name": "body", "required": true, "dataType": "any" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new E2eTestingDataSetupController();


      const promise = controller.updateCurrencyStatus.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.patch('/api/symbols/admin/:symbolId',
    authenticateMiddleware([{ "cookieAuth": [], "adminAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        symbolId: { "in": "path", "name": "symbolId", "required": true, "dataType": "string" },
        undefined: { "in": "body", "required": true, "dataType": "any" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new AdminSymbolsController();


      const promise = controller.setOrderRangeForSymbol.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/fees/transaction',
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

      const controller = new ExchangeConfigController();


      const promise = controller.retrieveTransactionFeeCaps.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/mobile/versions',
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

      const controller = new ExchangeConfigController();


      const promise = controller.retrieveMobileVersions.apply(controller, validatedArgs as any);
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
