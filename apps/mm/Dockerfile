FROM node:20-slim

WORKDIR /app
RUN npm install -g typescript
COPY ./apps/mm/package*.json ./
RUN npm install

COPY ./apps/mm .

EXPOSE 3003

#HEALTHCHECK CMD curl --fail http://localhost:3003/health || exit 1

CMD ["npm", "run", "dev"]
