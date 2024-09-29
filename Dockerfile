FROM node:22.9.0

ARG APP_TIMEZONE=Europe/Moscow

WORKDIR /usr/src/app

COPY . .

RUN npm i

EXPOSE 3000

CMD ["npm", "run", "start:dev"]