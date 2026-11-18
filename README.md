# Tarisira mobile app

## Supabase backend setup

The app uses Supabase Auth and normalized business tables protected by row-level security. Each business row is available only to its members; operational rows carry a `business_id` and are scoped by membership. No service-role key is used in the client.

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). This creates the business, product, sales, debtor, debtor payment, reminder, and supporting tables, then enables RLS policies that limit rows to members of the matching business. It also retains `public.app_state` for compatibility with existing user data.
3. In Supabase **Authentication → Sign In / Providers**, enable Phone and/or Email according to the signup methods you will support. Phone password recovery uses a Tarisira SMS reset link sent through Twilio; it works for verified phone numbers registered directly with Supabase Auth.
4. Copy `.env.example` to `.env` and fill in the Supabase project URL and publishable/anon key from **Project Settings → API**. These are public client credentials protected by RLS; never put the service-role key in the app.
5. Restart Expo after changing environment variables (`npx expo start -c`).

### Tarisira password-reset email branding

Email password-reset links are sent by Supabase Auth. In the Supabase Dashboard, go to **Authentication → Email Templates → Reset Password**, set the subject to `Reset your Tarisira password`, and use [`supabase/templates/password-recovery.html`](supabase/templates/password-recovery.html) as the email body. The template includes the required `{{ .ConfirmationURL }}` link.

To make the sender show as **Tarisira** in the recipient’s inbox, configure a custom SMTP provider under **Project Settings → Authentication → SMTP Settings** (or **Authentication → SMTP Settings**, depending on the Dashboard layout) and set its sender name to `Tarisira`. The email template controls the message contents; the SMTP sender configuration controls the sender display name. Changing app code alone cannot change either setting for the hosted Supabase project.

### Phone password-reset links

For an existing project, run [`supabase/phone-password-reset-setup.sql`](supabase/phone-password-reset-setup.sql) in the Supabase SQL Editor. New projects get the table and lookup function from `supabase/schema.sql`.

Configure Twilio SMS secrets, then deploy the public recovery Edge Function (its reset-token handling and password changes run server-side; never expose the service-role key to the app):

```sh
supabase secrets set TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_SMS_FROM=+263...
supabase functions deploy reset-password-phone
```

Use `TWILIO_MESSAGING_SERVICE_SID=MG...` instead of `TWILIO_SMS_FROM` when using a Messaging Service. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function. Reset links are random, single-use, expire after 15 minutes, and are limited to one SMS per account per minute. A phone number must be verified on the Supabase Auth account; a phone stored only as unverified profile metadata cannot be used to reset that account. The deep link opens the installed Tarisira app, so test this flow on an installed native build rather than Expo Go.

Without Supabase variables the app intentionally stays in demo mode. With Supabase configured, sign-up and sign-in use Supabase Auth, the session is persisted with Expo SecureStore on native platforms, and each user’s current business state is saved to their own RLS-protected row.

### Backend scope

Business data is stored in tenant-scoped relational tables. Database functions perform coupled operations such as recording a sale while decrementing stock and recording debtor payments. Configure email/phone verification, password recovery, backups, and production RLS testing before onboarding real customers.

### Change owed

The Change Owed page tracks change the tuckshop owes customers, grouped by customer, with outstanding totals and a way to mark amounts as repaid. On an existing Supabase project, run [`supabase/change-owed-setup.sql`](supabase/change-owed-setup.sql) in the SQL Editor. New projects get the table, access policies, and database functions from `supabase/schema.sql`.

### Automatic debt reminders

Automatic reminders require the owner’s approval and the debtor’s consent to both SMS and WhatsApp. When a debtor with a valid phone number is saved, the database queues reminders for 09:00 Africa/Harare exactly 24 hours before the due date. The sender checks that a balance is still outstanding and consent is still enabled. Phone numbers must use international E.164 format (for example, `+263771234567`).

For an existing project, run [`supabase/debt-reminders-setup.sql`](supabase/debt-reminders-setup.sql) in the Supabase SQL Editor. For a new project, `supabase/schema.sql` already includes the reminder schema. Both scripts notify PostgREST to reload its schema cache after adding the columns.

If saving a debtor reports that `customer_sms_opt_in` is missing from the schema cache, the existing Supabase database has not received this setup yet. Open **Supabase Dashboard → SQL Editor**, run the existing-project setup script above, wait for it to finish successfully, and then retry. The migration is safe to rerun and keeps existing debtor records.

1. In Twilio, configure an SMS sender or Messaging Service and an approved WhatsApp sender. Submit and approve a WhatsApp Content Template with four variables, in order: debtor name, business name, amount and optional item owed, and due date.
2. Deploy the Edge Function and set its secrets from a secure terminal (never add these credentials to the app or commit them):

   ```sh
   supabase functions deploy send-debt-reminders
   supabase secrets set TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_SMS_FROM=+263... TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 TWILIO_WHATSAPP_CONTENT_SID=HX...
   ```

   Use `TWILIO_MESSAGING_SERVICE_SID=MG...` instead of `TWILIO_SMS_FROM` if sending SMS through a Messaging Service. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the deployed function by Supabase.
3. In the Supabase Dashboard, enable `pg_cron`, `pg_net`, and Vault. Store the project URL and service-role key as Vault secrets named `supabase_url` and `supabase_service_role_key`. Do not put the service-role key in the mobile app or expose it in source control.
4. In the SQL Editor, schedule the function every five minutes. This request is authenticated with the Vault secret, so only the database scheduler can invoke the function:

   ```sql
   select cron.schedule(
     'send-debt-reminders-every-five-minutes',
     '*/5 * * * *',
     $job$
       select net.http_post(
         url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url')
           || '/functions/v1/send-debt-reminders',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key'),
           'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
         ),
         body := '{}'::jsonb
       );
     $job$
   );
   ```

The function tracks each channel separately, so a retry after one provider failure does not resend a channel that already succeeded. Confirm Twilio sender approval, template approval, Supabase function deployment, Vault secrets, and the cron job before relying on delivery.

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
