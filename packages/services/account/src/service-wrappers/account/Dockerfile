FROM 884998542479.dkr.ecr.ap-southeast-2.amazonaws.com/kbe-services-account-base
RUN npm run build:account
WORKDIR /sync/packages/services/account/src/service-wrappers/account

EXPOSE 3103

CMD ["ts-node-dev","--transpileOnly", "bootstrap.ts"]
