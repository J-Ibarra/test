FROM 884998542479.dkr.ecr.ap-southeast-2.amazonaws.com/kbe-services-withdrawal-base:latest

WORKDIR /sync/packages/services/withdrawal/src/service-wrappers/withdrawal-processor

EXPOSE 3114

CMD ["ts-node-dev","--transpileOnly", "bootstrap.ts"]
