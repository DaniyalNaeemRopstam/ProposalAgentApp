# Build from the monorepo root (required for npm workspaces + @proposalagent/shared):
#   docker build -f server/Dockerfile .
#
# On Railway: leave the service root at the repository root, set Dockerfile path to `server/Dockerfile`.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY server ./server
COPY apps ./apps

RUN npm ci
RUN npm run build -w @proposalagent/shared && npm run build -w server

FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages ./packages
COPY server ./server
COPY apps ./apps

RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/server/dist ./server/dist

EXPOSE 5000

WORKDIR /app/server
CMD ["npm", "start"]
