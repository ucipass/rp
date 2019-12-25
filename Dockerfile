FROM node:10.16.0-alpine

WORKDIR /source/rp

COPY package.json /source/rp

RUN cd /source/rp && npm i --only=production

COPY . .

EXPOSE 3000
CMD ["sh", "-c", "node server.js"]