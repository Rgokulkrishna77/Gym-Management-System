# IronCore Gym Management System

React 18 (Vite, Tailwind) + Node.js/Express REST API + MySQL 8.

## 1. Project structure

```
gym-management-system/
├── database/
│   └── schema.sql                 # tables, constraints, view, stored procedure, sample data
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js              # entry: loads env, checks DB, starts Express
│       ├── app.js                 # helmet, cors, json, routes, error handlers
│       ├── config/db.js           # mysql2 connection pool
│       ├── middleware/            # auth.js (JWT + RBAC), validate.js (Joi), errorHandler.js
│       ├── validators/schemas.js  # Joi request schemas
│       ├── routes/index.js        # all endpoints + role rules
│       ├── controllers/           # auth, member, plan, trainer, membership, workout, stats
│       ├── models/                # SQL (parameterized) for each entity
│       └── utils/                 # AppError, asyncHandler, shared SQL fragments
└── client/
    ├── .env.example
    ├── package.json, vite.config.js, tailwind.config.js, postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/                   # axios instance (JWT interceptor), services.js
        ├── context/AuthContext.jsx
        ├── hooks/useFetch.js
        ├── utils/                 # format.js, schemas.js (Yup rules)
        ├── components/            # DashboardLayout (sidebar+navbar), DataTable, Modal/ConfirmModal,
        │                          # FormControls, MemberFields, ProtectedRoute, ui.jsx, Icon.jsx
        └── pages/
            ├── Landing.jsx, Login.jsx, Register.jsx, NotFound.jsx
            ├── member/      Dashboard.jsx, Workouts.jsx
            ├── trainer/     Members.jsx, WorkoutEditor.jsx
            ├── reception/   RegisterMember.jsx, Renewals.jsx, Payments.jsx
            └── admin/       Dashboard.jsx, Members.jsx, Trainers.jsx, Plans.jsx
```

## 2. Setup and run

Requirements: Node.js 18+, MySQL 8.0.13+ (needed for `DEFAULT (CURRENT_DATE)` and CHECK constraints).

```bash
# 1. Database (uses the mysql CLI because the procedure needs DELIMITER)
mysql -u root -p < database/schema.sql

# 2. API
cd server
cp .env.example .env          # then set DB_PASSWORD and a long random JWT_SECRET
npm install
npm run dev                   # http://localhost:5000  (health check: /api/health)

# 3. Web app (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173  (Vite proxies /api to :5000)
```

Production build: `cd client && npm run build` (output in `client/dist`). If the API is on another origin, set `VITE_API_URL` and `CLIENT_URL` accordingly.

The sample data is dated relative to the day you run the script, so the "expired" member is always expired.

## 3. Test credentials (all passwords: `Password@123`)

| Role         | Email                  | Notes                                             |
|--------------|------------------------|---------------------------------------------------|
| Administrator| admin@gym.com          | full CRUD + stats dashboard                       |
| Receptionist | reception@gym.com      | register, renew, record payments                  |
| Trainer      | trainer@gym.com        | Tom Trainer (member GYM00001 is assigned to him)  |
| Trainer      | sara.trainer@gym.com   | second trainer                                    |
| Member       | member@gym.com         | GYM00001, active Quarterly plan, has a workout    |
| Member       | expired@gym.com        | GYM00002, expired Monthly plan (shows the banner) |
| Member       | nina@gym.com           | GYM00003, active, payment pending, no workout yet |

## 4. ER diagram (description)

```
users 1 ──── 0..1 trainers          (trainers.user_id  UNIQUE, FK → users, ON DELETE CASCADE)
users 1 ──── 0..1 members           (members.user_id   UNIQUE, FK → users, ON DELETE CASCADE)
trainers 1 ──── 0..* members        (members.trainer_id FK → trainers, ON DELETE SET NULL)
members 1 ──── 0..* memberships     (memberships.member_id FK, ON DELETE CASCADE)
membership_plans 1 ──── 0..* memberships (memberships.plan_id FK, ON DELETE RESTRICT)
memberships 1 ──── 0..* payments    (payments.membership_id FK, ON DELETE CASCADE)
members 1 ──── 0..* workout_plans   (workout_plans.member_id FK, ON DELETE CASCADE)
trainers 1 ──── 0..* workout_plans  (workout_plans.trainer_id FK, ON DELETE SET NULL)
workout_plans 1 ──── 1..* workout_plan_items (item.workout_id FK, ON DELETE CASCADE)
```

Design notes
- **3NF:** login data lives only in `users`; role-specific data in `members`/`trainers`; plan price/duration only in `membership_plans`; each purchase/renewal is a `memberships` row, each charge a `payments` row.
- **Unique Member ID:** `members.member_code` (`GYM00001`, ...) is UNIQUE and derived from the auto-increment key inside the registration transaction.
- **Constraints:** CHECKs on age (12-100), fee (> 0), duration (1-60), amount (> 0), `expiry_date > start_date`, `end_date >= start_date`, sets/reps ranges, phone pattern. UNIQUE on email, plan name, member code.
- **Indexes:** on every foreign key plus `memberships.expiry_date` and `payments.payment_date`.
- **View `v_expired_memberships`:** each member's latest membership if it has expired.
- **Procedure `sp_renew_membership`:** in one transaction it computes the new start (today, or the day after current expiry), sets expiry = start + plan duration, inserts the membership and a paid payment. Errors roll back.
- Membership status shown in the UI is derived from `expiry_date`, so it is correct without any scheduled job.

## 5. API summary

| Method & path | Roles | Purpose |
|---|---|---|
| POST `/api/auth/login` | public | returns JWT + user |
| POST `/api/auth/register` | public | member self-registration (payment pending) |
| GET `/api/auth/me` | any logged in | restore session |
| GET `/api/plans` | public | list plans |
| POST/PUT/DELETE `/api/plans[/:id]` | admin | plan CRUD |
| GET `/api/trainers` | public (contact info only for staff) | list trainers |
| POST/PUT/DELETE `/api/trainers[/:id]` | admin | trainer CRUD |
| GET `/api/members`, `/api/members/:id` | admin, receptionist, trainer | list / get |
| GET `/api/members/me` | member | own dashboard data |
| POST `/api/members` | admin, receptionist | register (payment paid) |
| PUT/DELETE `/api/members/:id` | admin | update / delete |
| GET `/api/memberships/expired` | admin, receptionist | reads the expired view |
| POST `/api/memberships/renew` | admin, receptionist | calls the stored procedure |
| GET `/api/payments/pending`, PATCH `/api/payments/:id/pay` | admin, receptionist | collect pending fees |
| GET `/api/workouts?memberId=` | trainer, admin | plans for a member |
| GET `/api/workouts/me` | member | own plans |
| POST `/api/workouts`, PUT `/api/workouts/:id` | trainer, admin | create / update plan with exercises |
| GET `/api/admin/stats` | admin | dashboard numbers + chart data |

Security: bcrypt password hashes (`bcryptjs`), JWT bearer auth, role middleware on every protected route, Joi validation, parameterized queries only, helmet, CORS allow-list, login rate limiting, central error handler (MySQL errors mapped to 400/404/409).

## 6. Test cases (one set per user story)

**Story 1 - Member registration**
| # | Steps | Expected |
|---|---|---|
| 1.1 | Open `/register`, submit empty form | Inline errors on every mandatory field; nothing sent |
| 1.2 | Enter age 5, phone "abc", email "x" | Age, phone and email errors shown |
| 1.3 | Fill valid details, choose a plan, submit | Confirmation page with a unique Member ID (e.g. GYM00004), plan, expiry date, fee with status "pending" |
| 1.4 | Register again with the same email | Toast "Email is already registered" (HTTP 409) |
| 1.5 | Log in as the new member | Dashboard shows the selected plan |
| 1.6 | `/` landing page, click "Choose plan" | Register form opens with that plan pre-selected |

**Story 2 - Member dashboard**
| # | Steps | Expected |
|---|---|---|
| 2.1 | Log in as member@gym.com | Plan Quarterly, joining date, expiry date, days left, payment status "paid" |
| 2.2 | Log in as expired@gym.com | Red banner "Your membership has expired", status badge "expired" |
| 2.3 | Log in as nina@gym.com | Payment status "pending" |
| 2.4 | As a member, open `/admin` | Redirected back to `/member` |
| 2.5 | `GET /api/members` with a member token | 403 |

**Story 3 - Trainer module**
| # | Steps | Expected |
|---|---|---|
| 3.1 | Log in as trainer@gym.com | Members table with search, sort, pagination |
| 3.2 | "Create / update" on Nina, add exercises, save | Toast "Workout plan saved"; plan listed under Existing plans |
| 3.3 | Save with no exercise name / end date before start | Validation errors, nothing saved |
| 3.4 | Edit the plan, change sets, save | Toast "updated"; list refreshes |
| 3.5 | Log in as nina@gym.com, open My Workout Plan | Updated plan visible grouped by day |

**Story 4 - Receptionist module**
| # | Steps | Expected |
|---|---|---|
| 4.1 | Register Member with valid data + payment method | Confirmation with Member ID, expiry and "paid" payment |
| 4.2 | Open Renewals | Expired Eddie listed (from the view) |
| 4.3 | Renew with a plan and method | Confirmation modal with the new period; expiry = today + plan duration (calculated automatically); member leaves the list |
| 4.4 | Log in as the renewed member | Banner gone, new expiry shown, payment "paid" |
| 4.5 | Pending Payments, "Mark as paid" for Nina | Row disappears; member dashboard shows "paid" |

**Story 5 - Admin module**
| # | Steps | Expected |
|---|---|---|
| 5.1 | Admin dashboard | Total members, active vs expired, monthly revenue, trainer count, charts |
| 5.2 | Members: add, edit (assign trainer), delete | Delete asks for confirmation; table updates immediately |
| 5.3 | Trainers: add, edit, delete | Same; deleting a trainer unassigns their members |
| 5.4 | Plans: change a fee | Landing page shows the new fee on reload |
| 5.5 | Delete a plan that members purchased | Toast "in use ... cannot be deleted" (409) |
| 5.6 | Receptionist opens `/admin` | Redirected to `/reception` |

**API quick checks** (replace `$TOKEN`)
```bash
curl -s -X POST localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@gym.com","password":"Password@123"}'
curl -s localhost:5000/api/admin/stats -H "Authorization: Bearer $TOKEN"
curl -s localhost:5000/api/members            # 401 without a token
```
