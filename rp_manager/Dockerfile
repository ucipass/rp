FROM node:12.16.0-alpine AS gui
WORKDIR /source/rp/gui
RUN export VUE_APP_PREFIX=rp
COPY gui/package.json .
RUN npm install 
COPY gui/src ./src
COPY gui/babel.config.js .
COPY gui/vue.config.js .
RUN npm run build

FROM node:12.16.0-alpine
WORKDIR /source/rp
COPY package.json .
RUN npm install  --only=production
COPY app.js .
COPY server.js .
COPY mongooseclient.js .
COPY delay.js .
COPY jsondata.js .
COPY --from=gui /source/rp/gui/dist ./gui/dist

CMD ["node", "server.js"]
#CMD ["sh", "-c", "sleep 6000"]