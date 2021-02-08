FROM node:14

WORKDIR /usr/src/app
COPY . .
#COPY lib ./dev-in-prod-lib
COPY ../lib /tmp/lib
RUN yarn add ./dev-in-prod-lib
RUN yarn
EXPOSE 3001
CMD ["yarn", "ts-node", "main.ts"]
