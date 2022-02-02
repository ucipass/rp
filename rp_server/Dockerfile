FROM node:10.16.0-alpine

WORKDIR /source/rp
COPY ../rp_server/package.json ./rp_server/
RUN npm install 
COPY ../rp_server/rp_server.js ./sioserver/rp_server.js
COPY ../lib ./lib/

EXPOSE 3000

RUN export VUE_APP_PREFIX="rp"

CMD ["sh", "-c", "rp_server/rp_server.js"]
#CMD ["sh", "-c", "sleep 6000"]