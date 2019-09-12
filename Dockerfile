# Creates the Trial Management Tool.
#
# You can access the container using:
#   docker run -it trial-management-tool sh
# To start it stand-alone:
#   docker run -it -p 8888:3210 trial-management-tool

FROM node:alpine AS builder
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
RUN apk --no-cache add python make g++

# RUN apk add --no-cache --virtual .gyp python make g++ git && \
#   npm i -g yalc
# ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
# optionally if you want to run npm global bin without specifying path
# ENV PATH=$PATH:/home/node/.npm-global/bin
ENV PARCEL_WORKERS=1
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /usr/src/app/public ./public
COPY proxy.js ./
EXPOSE 80
CMD ["node", "/usr/src/app/proxy.js"]
