FROM 884998542479.dkr.ecr.ap-southeast-2.amazonaws.com/kbe-services-order-base

WORKDIR /sync/packages/services/order/src/service-wrappers/order-gateway

EXPOSE 3105

CMD ["ts-node-dev","--transpileOnly", "bootstrap.ts"]
