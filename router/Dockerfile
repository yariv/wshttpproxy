FROM node:14

WORKDIR /usr/src/app
COPY . .
# hack to get around baseUrl not working in tsconfig.json
RUN yarn
RUN yarn add .docker_imports/dev-in-prod-lib
RUN yarn add .docker_imports/typedApi
EXPOSE 80
CMD ["yarn", "ts-node", "routerMain.ts"]
