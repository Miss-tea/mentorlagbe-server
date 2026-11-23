## API overview

| Area | Routes |
| ---  | ---    |
| Public | `GET /api/tuitions` (search, filter, sort, pagination), `GET /api/tuitions/:id` |
| Student | applications (apply, list, cancel), bookmarks, stats |
| Tutor | tuitions (create, edit, toggle, delete), applicants, stats |
| Admin | users and roles, tuition approvals, transactions, stats |
| Payments | `POST /api/payments/create-checkout-session`, `GET /api/payments/verify`, `POST /api/payments/webhook` |
| Upload | `POST /api/upload` (ImgBB) |

Protected routes use `verifyToken` plus `verifyStudent`, `verifyTutor` or `verifyAdmin`.

## Run locally

```bash
npm install
cp .env.example .env   # fill in the values
npm run seed           # sample tuitions and applications
npm run dev
```

Environment variables: `MONGODB_URI`, `DB_NAME`, `CLIENT_URL`, `AUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `IMGBB_API_KEY`.