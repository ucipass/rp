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
COPY manager/package.json .
RUN npm install  --only=production
COPY manager/app.js ./manager/
COPY manager/index.js ./manager/
COPY lib ./lib/
COPY --from=gui /source/rp/gui/dist ./manager/gui/dist

CMD ["node", "server.js"]
#CMD ["sh", "-c", "sleep 6000"]