FROM node:10

ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

RUN mkdir /sync
WORKDIR /sync

# Cache node modules
COPY package.json .
COPY package-lock.json .
COPY .npmrc .
ARG NPM_TOKEN

RUN npm install

# Copy only production code
COPY src/ src/

COPY docker-start.sh .

EXPOSE 3003

CMD  "./docker-start.sh"
