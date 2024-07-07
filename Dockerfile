FROM node:current-alpine

# Install Puppeteer under /node_modules so it's available system-wide
WORKDIR /app
COPY . /app

RUN npm install
RUN npm run build
CMD [ "npm", "start" ]
