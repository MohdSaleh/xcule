FROM node:18

WORKDIR /app

COPY package*.json ./

COPY ./ ./

RUN npm install

EXPOSE ${REACT_PORT}

CMD ["npm","start"]