FROM node:18

WORKDIR /app

COPY package*.json ./

COPY ./ ./

RUN npm install nodemon

RUN npm install

CMD ["npm","start"]