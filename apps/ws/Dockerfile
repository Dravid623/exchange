FROM node:20-slim

WORKDIR /app
RUN npm install -g typescript
COPY ./apps/ws/package*.json ./
RUN npm install

COPY ./apps/ws .

EXPOSE 3001

# HEALTHCHECK CMD curl --fail http://localhost:3001/health || exit 1

CMD ["npm", "run", "dev"]
