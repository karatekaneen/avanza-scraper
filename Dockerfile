FROM node:current
RUN apt-get update \
	&& apt-get install -y wget gnupg \
	&& wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
	&& sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
	&& apt-get update \
	&& apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libxshmfence1 libglu1 \
	--no-install-recommends \
	&& rm -rf /var/lib/apt/lists/*

# Install Puppeteer under /node_modules so it's available system-wide
WORKDIR /app
COPY . /app

RUN npm install
RUN npm run build
CMD [ "npm", "start" ]
