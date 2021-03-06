FROM node:13.6.0-alpine3.10

# Required by lerna bootstrap (some 3rd party dependencies are fetched from git)
RUN apk add --update git openssh
RUN apk add --update alpine-sdk

ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

RUN mkdir /sync
WORKDIR /sync

# Installing monorepo dependencies
COPY .npmrc .
COPY package.json .
COPY package-lock.json .
COPY lerna.json .
COPY tsconfig.json .
COPY tsconfig.build.json .

RUN npm install --loglevel notice
RUN npm i -g typescript
RUN npm i -g ts-node-dev

# Copying required modules (.dockerignore will make sure, node_modules are not copied over)
COPY packages/libs ./packages/libs
COPY packages/services/debit-card ./packages/services/debit-card

RUN npm run bootstrap:production
RUN npm run build:debit-card
WORKDIR /sync/packages/services/debit-card

EXPOSE 3031

CMD ["ts-node-dev","--transpileOnly", "src/bootstrap.ts"]
