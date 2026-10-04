# HostelDesk V5 — PostgreSQL Runtime

The application APIs now use PostgreSQL for authentication, sessions, customers, rooms/beds, students, guests, payments, student history and guest history.

## Setup

1. Create a PostgreSQL database.
2. Put the connection string in `.env.local`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

3. Initialize the schema:

```bash
npm run db:init
```

4. Preserve/migrate the existing `data/db.json` records:

```bash
npm run migrate:postgres
```

5. Verify counts:

```bash
npm run verify:postgres
```

6. Start the application:

```bash
npm run dev
```

After this switch, `data/db.json` is retained only as the original migration backup/source. The runtime APIs no longer read or write it.

## Important production rule

Do not expose `DATABASE_URL` to the browser. Keep it server-side in `.env.local`/deployment environment variables. ID proof images should later be moved from data URLs/local JSON into private object storage before public production launch.
