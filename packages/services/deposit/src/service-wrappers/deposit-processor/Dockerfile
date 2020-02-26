FROM 884998542479.dkr.ecr.ap-southeast-2.amazonaws.com/kbe-services-deposit-base:latest

WORKDIR /sync/packages/services/deposit/src/service-wrappers/deposit-processor

EXPOSE 3112

CMD ["ts-node-dev","--transpileOnly", "src/bootstrap.ts"]
