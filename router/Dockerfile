FROM node:14

WORKDIR /usr/src/app
COPY . .
RUN yarn add ./dev-in-prod-lib
RUN yarn add ./typedApi
RUN yarn
EXPOSE 80
CMD ["yarn", "ts-node", "routerMain.ts"]
