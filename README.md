# E-commerce Platform (WIP)

Comprehensive e-commerce application covering both the storefront (future React/Next.js client) and backend services (NestJS API). The project is under active development and will evolve into a full-stack solution.

## Repository Layout

- `api/` – NestJS TypeScript backend with authentication, users, and the first iteration of the product/catalog module (checkout, orders, etc. still in progress)
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

### Product Catalog Module

Products are now managed end-to-end through DTOs, services, and controller endpoints:

- **DTOs** – `CreateProductDto`, `UpdateProductDto`, and `QueryProductsDto` provide validation for writes and filter/query params (search, price ranges, sorting, pagination).
- **Service** – `ProductsService` wraps Prisma with:
  - Typed projections via a shared `PRODUCT_SELECT`.
  - Cursor or offset pagination, returning `{ data, total, nextCursor }`.
  - Filtering by search text (`name`, `description`, `sku`) and price ranges.
  - Sort mapping (`price_asc`, `price_desc`, `newest`) backed by `Prisma.SortOrder`.
  - Slug generation/de-duping when creating or renaming products.
  - Soft disable support (flip `active` to `false`) and hard delete.
- **Controller** – `ProductsController` exposes the endpoints below. Admin-only routes are guarded by `AuthGuard('jwt')` + `RolesGuard`.

#### REST Endpoints

| Method   | Route                   | Auth   | Description                                                       |
| -------- | ----------------------- | ------ | ----------------------------------------------------------------- |
| `GET`    | `/products`             | public | List products with filtering/pagination (see query params below). |
| `GET`    | `/products/:id`         | public | Fetch a single product by id.                                     |
| `POST`   | `/products`             | admin  | Create a product; auto-generates slug.                            |
| `PATCH`  | `/products/:id`         | admin  | Update mutable fields; regenerates slug if `name` changes.        |
| `PATCH`  | `/products/:id/disable` | admin  | Convenience route to mark `active = false`.                       |
| `DELETE` | `/products/:id`         | admin  | Permanently delete a product.                                     |

**Query parameters (`GET /products`):**

| Param                             | Type                                      | Notes                                                                       |
| --------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `search`                          | string                                    | Case-insensitive match on `name`, `description`, or `sku`.                  |
| `minPriceCents` / `maxPriceCents` | number                                    | Inclusive range filter.                                                     |
| `sort`                            | `'price_asc' \| 'price_desc' \| 'newest'` | Maps to Prisma `orderBy`.                                                   |
| `limit`                           | number                                    | Page size (default 20).                                                     |
| `offset`                          | number                                    | Offset pagination when no `cursor` is provided.                             |
| `cursor`                          | string                                    | Use keyset pagination; response returns `nextCursor` when more data exists. |

> Tip: Admin endpoints require `Authorization: Bearer <JWT>` and a role of `ADMIN`.

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
- [x] Build product/catalog domain (CRUD, filters, pagination, admin workflows)
- [ ] Integrate cart and checkout logic
- [ ] Implement order management and notifications
- [ ] Scaffold frontend workspace and shared tooling

### Next Phases

1. **Phase 4 – Products (wrap-up)**: Extend specs/tests, add public slug lookups, and wire products into seeding scripts.
2. **Phase 5 – Cart**: Add/update/remove line items, calculate totals, guard against stock drift, and merge guest carts into user carts on login.
3. **Phase 6 – Payments**: Abstraction layer that supports Stripe Payment Intents and PayPal Orders; webhook handlers mark payments/orders and decrement inventory.
4. **Phase 7 – Orders**: User order history plus admin management screens/flows.
5. **Phase 8 – Frontend (React + Vite + TS)**: RTK Query client, authentication flows, catalog pages, cart UI, Stripe Elements checkout, and PayPal Buttons integration.

## Recent Progress

- Product DTOs (`create`, `update`, `query`) finalized with validation and transformation rules.
- `ProductsService` wired to Prisma with slug handling, filtering, pagination, and admin-safe CRUD helpers.
- `ProductsController` exposes public catalog reads and guarded admin management routes (create/update/disable/delete).
- README now documents environment setup, Prisma usage, and product API surface so frontend devs know how to integrate.

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
