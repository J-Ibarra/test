FROM 884998542479.dkr.ecr.ap-southeast-2.amazonaws.com/kbe-services-deposit-base

WORKDIR /sync/packages/services/deposit/src/service-wrappers/deposit-api

EXPOSE 3112

CMD ["ts-node-dev","--transpileOnly", "bootstrap.ts"]
