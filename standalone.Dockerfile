##### BUILD IT WITH 
# docker build –f  DOCKERFILE -t USERNAME/APP . 
# docker run -p 8080-8081:8080-8081 -e DATABASE_URL="mongodb://172.18.100.8:27017/rptest" ucipass/rpst 

FROM node:12.16.0-alpine AS gui
WORKDIR /source/rp/gui
RUN export VUE_APP_PREFIX=rp
COPY manager/gui/package.json .
RUN npm install 
COPY manager/gui/src ./src
COPY manager/gui/babel.config.js .
COPY manager/gui/vue.config.js .
RUN npm run build

FROM node:12.16.0-alpine
WORKDIR /source/rp
COPY package.json .
RUN npm install  --only=production
#Libraries
COPY lib ./lib/
# Manager
COPY manager/app.js ./manager/
COPY manager/index.js ./manager/
COPY --from=gui /source/rp/gui/dist ./manager/gui/dist
# SIO
COPY sioserver/sio-server.js ./sioserver/sio-server.js
# Main
COPY index.js .

#EXPOSE 8080
#EXPOSE 8081

CMD ["node", "index.js"]
