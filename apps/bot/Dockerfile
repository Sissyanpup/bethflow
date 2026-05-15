FROM node:22-alpine AS development
WORKDIR /workspace/apps/bot
COPY apps/bot/package*.json ./
RUN npm install
CMD ["npm", "run", "dev"]
