FROM node:18-alpine

WORKDIR /app

# Only install production dependencies by default
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source
COPY . .

ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
