FROM node:14

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
EXPOSE 3001
CMD ["yarn", "ts-node", "main.ts"]

