FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with retry and timeout settings
RUN npm ci --only=production --no-audit --no-fund --timeout=300000

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]