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
pnpm start:dev
```

Key scripts:

- `pnpm start` – Run in production mode
- `pnpm start:dev` – Live reload during development
- `pnpm build` – Compile TypeScript sources
- `pnpm test` / `pnpm test:watch` / `pnpm test:cov` – Jest test pipeline
- `pnpm lint` / `pnpm format` – Code quality and formatting

### Environment Setup

Create `api/.env` to configure secrets and infrastructure:

```
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
JWT_SECRET="change-me"
PORT=3000
```

## Frontend (upcoming)

The frontend stack will be introduced in `frontend/`. Plans include:

- Modern React-based SPA/SSR
- Authentication against the API
- Product catalog, cart, checkout, order history flows
- Shared TypeScript types between client and server

## Roadmap

- [ ] Define Prisma schema and database migrations
- [ ] Implement auth (register/login, JWT, guards)
- [ ] Build product/catalog domain
- [ ] Integrate cart and checkout logic
- [ ] Implement order management and notifications
- [ ] Scaffold frontend workspace and shared tooling

## Contributing

1. Fork / clone the repository
2. Create a feature branch (`git checkout -b feature/scope`)
3. Implement changes with accompanying tests
4. Run `pnpm lint` and `pnpm test`
5. Open a pull request detailing the changes and testing performed

## License

This work is currently proprietary while development continues. Future licensing will be documented upon release.

