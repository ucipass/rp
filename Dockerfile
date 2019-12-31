
FROM node:10.16.0-alpine

RUN export VUE_APP_PREFIX=rp

WORKDIR /source/rp

COPY package.json .

RUN npm install  --only=production

COPY . .

WORKDIR /source/rp/manager

RUN npm install 

RUN npm run build 

WORKDIR /source/rp

EXPOSE 3000

RUN export VUE_APP_PREFIX="rp"

CMD ["sh", "-c", "node server.js"]