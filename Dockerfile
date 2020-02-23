FROM node:10.16.0-alpine

RUN export VUE_APP_PREFIX=rp

WORKDIR /source/rp
COPY package.json .
RUN npm install  --only=production
COPY events.js .
COPY jsondata.js .
COPY mongooseclient.js .
COPY server.js .
COPY sio-app.js .
COPY sio-client.js .
COPY sio-server.js .
COPY manager ./manager
RUN npm run client_win  --only=production
RUN npm run client_lin  --only=production
RUN npm run client_mac  --only=production

WORKDIR /source/rp/manager
RUN npm install 
RUN npm run build
# DELETE EVERYTHING EXCEPT dist to save space
RUN ls | grep -v dist | xargs rm -rf 

WORKDIR /source/rp

EXPOSE 3000

RUN export VUE_APP_PREFIX="rp"

CMD ["sh", "-c", "node server.js"]
#CMD ["sh", "-c", "sleep 6000"]