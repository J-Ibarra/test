/* tslint:disable */
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { MarketDataController } from './market_data_controller';
import { MidPriceController } from './mid_price_controller';
import { expressAuthentication } from './middleware/authentication';
import * as express from 'express';

const models: TsoaRoute.Models = {
};
const validationService = new ValidationService(models);

export function RegisterRoutes(app: express.Express) {
  app.get('/api/market-data/ohlc',
    function(request: any, response: any, next: any) {
      const args = {
        symbolId: { "in": "query", "name": "symbolId", "required": true, "dataType": "string" },
        timeFrame: { "in": "query", "name": "timeFrame", "required": true, "dataType": "enum", "enums": ["1", "5", "15", "30", "60", "240", "360", "720", "1440"] },
        fromDate: { "in": "query", "name": "fromDate", "required": true, "dataType": "datetime" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MarketDataController();


      const promise = controller.getOHLCMarketData.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/market-data/snapshots/all',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
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

      const controller = new MarketDataController();


      const promise = controller.getMarketDataSnapshotForAllCurrencies.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/market-data/snapshots/:currency',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        currency: { "in": "path", "name": "currency", "required": true, "dataType": "enum", "enums": ["ETH", "KAU", "KAG", "KVT", "BTC", "USDT", "USD", "EUR", "GBP"] },
        request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MarketDataController();


      const promise = controller.getMarketDataSnapshotForCurrency.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/mid-price',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        symbolPairId: { "in": "query", "name": "symbolPairId", "required": true, "dataType": "string" },
        timeFrame: { "in": "query", "name": "timeFrame", "dataType": "enum", "enums": ["1", "5", "15", "30", "60", "240", "360", "720", "1440"] },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MidPriceController();


      const promise = controller.getMidPriceForSymbolPair.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/mid-price/real-time',
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

      const controller = new MidPriceController();


      const promise = controller.getRealTimeMidPriceForWalletSymbols.apply(controller, validatedArgs as any);
      promiseHandler(controller, promise, response, next);
    });
  app.get('/api/mid-price/real-time/:symbolId',
    authenticateMiddleware([{ "cookieAuth": [] }, { "tokenAuth": [] }]),
    function(request: any, response: any, next: any) {
      const args = {
        symbolId: { "in": "path", "name": "symbolId", "required": true, "dataType": "string" },
      };

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request);
      } catch (err) {
        return next(err);
      }

      const controller = new MidPriceController();


      const promise = controller.getRealTimeMidPriceForSymbol.apply(controller, validatedArgs as any);
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
