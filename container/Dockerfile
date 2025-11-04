FROM node:18-alpine

RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY . .
RUN npm install


CMD [ "npm","start" ]