FROM node:20-slim

WORKDIR /app
RUN npm install -g typescript
COPY ./apps/engine/package*.json ./
RUN npm install

COPY ./apps/engine .

EXPOSE 3002

# HEALTHCHECK CMD curl --fail http://localhost:3002/health || exit 1

CMD ["npm", "run", "dev"]
