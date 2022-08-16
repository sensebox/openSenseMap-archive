# Based on best pratices provided by Snyk.io
# https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/

# --------------> The build image
FROM node:latest AS build
WORKDIR /usr/src/app
COPY package*.json /usr/src/app/
RUN npm ci --only=production

# --------------> The production image
FROM node:18.7.0-buster-slim
RUN apt-get update -y && apt-get install -y \
  dumb-init \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --chown=node:node . /usr/src/app
CMD ["./wait-for-it.sh", "mongo:27017", "--strict", "--timeout=300", "--", "dumb-init", "node", "/usr/src/app/archive.js"]