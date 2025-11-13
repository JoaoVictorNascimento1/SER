FROM node:18-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm rebuild canvas --build-from-source

COPY . .

CMD ["npm", "start"]