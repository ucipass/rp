FROM node:10.16.0-alpine

RUN export VUE_APP_PREFIX=rp

WORKDIR /source/rp
COPY package.json .
RUN npm install  --only=production
COPY lib ./lib
COPY sioserver/sio-server.js ./sioserver/sio-server.js

EXPOSE 8081

CMD ["sh", "-c", "node sioserver/sio-server.js"]
#CMD ["sh", "-c", "sleep 6000"]