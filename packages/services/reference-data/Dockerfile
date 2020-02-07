FROM node:10

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
RUN npm i lerna -g --loglevel notice
RUN npm i -g typescript
RUN npm i -g ts-node-dev

# Copying required modules (.dockerignore will make sure, node_modules are not copied over)
COPY packages/libs ./packages/libs
COPY packages/services/reference-data ./packages/services/reference-data

RUN lerna bootstrap
WORKDIR /sync/packages/services/reference-data

EXPOSE 3101

CMD  "./docker-start.sh"
