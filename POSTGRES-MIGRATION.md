# HostelDesk V5 — PostgreSQL Migration

This phase prepares the current HostelDesk JSON data model for PostgreSQL without deleting or reshaping the application records.

## What is preserved

- Customers / Super Admin accounts
- Tenant IDs
- Rooms and floor numbers
- Beds, occupancy state, and student assignment
- Students and their personal/room/payment fields
- Guests and guest payload fields
- Payments
- Student checkout history
- Guest checkout history
- Audit logs
- Existing proof references, when present
- The original JSON object for students is retained in `students.raw_data`
- The complete guest record is retained in `guests.payload`

## Important migration behavior

The old JSON build can contain `users` instead of `customers`. The migration maps those legacy users to `SUPER_ADMIN` customer records. The current application's demo customer is also created if it does not already exist.

Records without a tenant ID are assigned to the existing demo tenant `TENANT-DEMO`, matching the current local application's `ensureDB()` behavior.

## Run on your Mac

From the project folder:

```bash
npm install
```

This installs the new `pg` dependency. Network access is required the first time.

Create `.env.local` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/hosteldesk"
```

Then run:

```bash
npm run migrate:postgres
npm run verify:postgres
```

The migration is transactional: if an insert fails, PostgreSQL rolls the migration back.

## Do not delete `data/db.json` yet

Keep the JSON database as the source backup until the PostgreSQL counts and records are verified. The next development phase will switch the application API/auth/session layer from JSON reads/writes to PostgreSQL.

## Current limitation

The migration code is prepared and syntax-checked in this package, but it was not executed against a live PostgreSQL server in this environment because no PostgreSQL connection was supplied and package-registry access is unavailable here.
