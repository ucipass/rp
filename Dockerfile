FROM node:10.16.0-alpine

WORKDIR /source/rp

COPY package.json .

RUN npm install  --only=production

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "node server.js"]