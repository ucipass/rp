FROM node:10.16.0-alpine

RUN export VUE_APP_PREFIX=rp

WORKDIR /source/rp

COPY package.json .

RUN npm install  --only=production

COPY manager ./manager

COPY events.js .
COPY jsondata.js .
COPY mongoclient.js .
COPY server.js .
COPY sio-app.js .
COPY sio-client.js .
COPY sio-server.js .

WORKDIR /source/rp/manager

RUN npm install 

RUN npm run build 

WORKDIR /source/rp

EXPOSE 3000

RUN export VUE_APP_PREFIX="rp"

CMD ["sh", "-c", "node server.js"]