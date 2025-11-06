# E-commerce Platform (WIP)

Comprehensive e-commerce application covering both the storefront (future React/Next.js client) and backend services (NestJS API). The project is under active development and will evolve into a full-stack solution.

## Repository Layout

- `api/` – NestJS TypeScript backend with authentication, catalog, checkout, and order management modules (in progress)
- `frontend/` – Placeholder for the upcoming web client
- `package.json` – Workspace-level metadata and package manager declaration

## Backend (api/)

The backend leverages NestJS 11, Prisma ORM, and pnpm.

```bash
cd api
pnpm install
pnpm prisma generate
pnpm start:dev
```

Core scripts:

- `pnpm start` – Run in production mode
- `pnpm start:dev` – Live reload during development
- `pnpm build` – Compile TypeScript sources
- `pnpm test` / `pnpm test:watch` / `pnpm test:cov` – Jest pipelines
- `pnpm lint` / `pnpm format` – Code quality and formatting
- `pnpm prisma migrate dev` – Apply database migrations (after editing `prisma/schema.prisma`)

### Environment Setup

Configuration is loaded globally via `@nestjs/config`. Create `api/.env` before starting the server:

```
DATABASE_URL="postgresql://se_user:se_pass@localhost:5432/se_db?schema=public"
PORT=3000

# JWT
JWT_ACCESS_SECRET="dev_access_secret_change_me"
JWT_REFRESH_SECRET="dev_refresh_secret_change_me"
JWT_ACCESS_TTL="900s"
JWT_REFRESH_TTL="7d"
```

Prisma also reads `DATABASE_URL` while evaluating `prisma.config.ts`. When running CLI commands outside `api/`, point Prisma to the config/schema explicitly or export the variable in your shell.

### Prisma Module & Service

`PrismaModule` is marked `@Global()` so the same `PrismaService` instance is reused everywhere. The service extends `PrismaClient<Prisma.PrismaClientOptions, 'beforeExit'>`, enabling the `'beforeExit'` hook for graceful shutdowns:

- `onModuleInit` connects to the database during bootstrap.
- `enableShutdownHooks` registers the `beforeExit` listener so Nest can close cleanly when Prisma exits.

Call `prismaService.enableShutdownHooks(app)` from bootstrap code or test harnesses that manage the Nest application lifecycle.

### Application Bootstrap

`main.ts` creates the Nest app with CORS enabled and adds a global `ValidationPipe` (whitelist/forbid unknown properties, transform inputs). The server listens on `process.env.PORT ?? 3000`.

### Prisma Schema & Migrations

`prisma/schema.prisma` defines the initial domain: users, products, carts, orders, payments, plus supporting enums. Regenerate the client and apply migrations after schema changes:

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

## Frontend (upcoming)

The frontend stack will arrive in `frontend/` with plans for:

- React-based SPA/SSR
- Authentication against the API
- Product catalog, cart, checkout, and order history flows
- Shared TypeScript types between client and server

## Roadmap

- [x] Define Prisma schema and generate client
- [x] Add global config module + Prisma infrastructure
- [x] Implement auth (register/login, JWT, guards)
- [ ] Build product/catalog domain
- [ ] Integrate cart and checkout logic
- [ ] Implement order management and notifications
- [ ] Scaffold frontend workspace and shared tooling

## Recent Commits

The latest work on `main` delivered the first slice of authentication and user management:

- 2025-11-06 – `feat: implement authentication module with JWT support, user registration, and login functionality` (`54856fb`)
- 2025-11-06 – `feat: implement user creation logic with validation and password hashing` (`20a0a35`)
- 2025-11-06 – `docs: update README.md with environment setup, Prisma schema, and migration instructions` (`09e13c7`)
- 2025-11-06 – `feat: add Prisma module and service for database integration` (`ede37d1`)
- 2025-11-06 – `feat: add initial Prisma schema, migration files, and configuration` (`721eecb`)

## Contributing

1. Fork / clone the repository
2. Create a feature branch (`git checkout -b feature/scope`)
3. Implement changes with accompanying tests
4. Run `pnpm lint` and `pnpm test`
5. Open a pull request detailing the changes and testing performed

## License

This work is currently proprietary while development continues. Future licensing will be documented upon release.
