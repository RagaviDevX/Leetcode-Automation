FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Install playwright browsers
RUN npx playwright install chromium --with-deps

EXPOSE 3001

CMD ["node", "dist/index.js"]
