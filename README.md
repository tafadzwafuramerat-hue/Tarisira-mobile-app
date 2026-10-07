# Tarisira mobile app

## Supabase backend setup

The app uses Supabase Auth and a per-user `app_state` JSONB row protected by row-level security. No service-role key is used in the client.

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). This creates `public.app_state`, enables RLS, and restricts each user to their own row.
3. In Supabase **Authentication → Providers**, enable Phone and/or Email according to the signup methods you will support. If email confirmations or phone OTP confirmations are enabled, complete that confirmation flow before expecting an authenticated session.
4. Copy `.env.example` to `.env` and fill in the Supabase project URL and publishable/anon key from **Project Settings → API**. These are public client credentials protected by RLS; never put the service-role key in the app.
5. Restart Expo after changing environment variables (`npx expo start -c`).

Without Supabase variables the app intentionally stays in demo mode. With Supabase configured, sign-up and sign-in use Supabase Auth, the session is persisted with Expo SecureStore on native platforms, and each user’s current business state is saved to their own RLS-protected row.

### Current backend scope

The initial integration persists the existing app state document (business profile, products, debtors, transactions, reminders, and selected language). It is a starting migration layer, not yet a normalized relational schema. Before production use, migrate these collections into individual tables and add database transactions/RPC functions for coupled operations such as recording a sale and decrementing stock. Configure email/phone verification, password recovery, backups, and production RLS testing before onboarding real customers.

## Run the app

- `npm install`
- `npx expo start`
# Tarisira

Sell more. Owe less. Grow.

## Run it
1. Install Node.js LTS (nodejs.org) and the Expo Go app on your phone.
2. In this folder run:  npm install
3. Then:                npx expo start
4. Scan the QR code (Expo Go on Android, Camera app on iPhone).
   Phone and computer must be on the same Wi-Fi. If it won't connect: npx expo start --tunnel

## Structure (Expo Router: each file in app/ is a screen)
app/
  _layout.tsx        root stack + app state provider
  index.tsx          splash
  language.tsx  login.tsx  signup.tsx
  business.tsx  business-size.tsx  currency.tsx  done.tsx
  settings.tsx
  (tabs)/
    _layout.tsx      bottom tab bar + top bar
    home.tsx  stock.tsx  sales.tsx  debtors.tsx  reports.tsx
components/          shared UI, forms, charts, top bar
constants/           theme colours, English/Shona text
context/             app state (products, debtors, sales, language, sign-up data)
