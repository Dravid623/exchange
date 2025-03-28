FROM node:20-slim

WORKDIR /app
RUN npm install -g typescript
COPY ./apps/engine/package*.json ./
RUN npm install

COPY ./apps/engine .
CMD ["npm", "run", "dev"]
