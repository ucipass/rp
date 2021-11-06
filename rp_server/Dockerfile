FROM node:10.16.0-alpine

WORKDIR /source/rp
COPY ../sioserver/package.json ./sioserver/
RUN npm install  --only=production
COPY ../sioserver/sio-server.js ./sioserver/sio-server.js
COPY ../lib ./lib/

EXPOSE 3000

RUN export VUE_APP_PREFIX="rp"

CMD ["sh", "-c", "sioserver/sio-server.js"]
#CMD ["sh", "-c", "sleep 6000"]