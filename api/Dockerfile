FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH

# ---- dependencies (full install, includes dev) ----
FROM base AS deps
COPY package.json ./
RUN npm install --include=dev --no-audit --no-fund

# ---- build ----
FROM deps AS build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate
RUN npx tsc -p tsconfig.json

# ---- dev runtime (tsx watch) ----
FROM deps AS dev
ENV NODE_ENV=development
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/index.ts"]

# ---- prod runtime (compiled JS) ----
FROM base AS prod
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/index.js"]
