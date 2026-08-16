FROM node:20-alpine AS base
WORKDIR /usr/src/app
RUN apk add --no-cache libc6-compat

FROM base AS dependencies
COPY package*.json ./
RUN npm install

FROM dependencies AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM base AS production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=build --chown=nestjs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/package.json ./package.json

USER nestjs

EXPOSE 4000

CMD ["node", "dist/src/main"]
