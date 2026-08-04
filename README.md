# Kulture Konnect — Partner Stays (MVP)

Staff-facing tool used during walk-in reservations: browse partner properties/rooms,
confirm a booking in one step, which blocks the room and automatically notifies the
partner via WhatsApp. No online payment — payment is still collected in person at
Kulture Konnect, same as today.

Scope matches the MVP (P0) section of the PRD — nothing else is built in yet on purpose.

## Stack

- React + Vite, Tailwind CSS v4
- Supabase (Postgres + Auth + Edge Functions)
- WhatsApp Business API (called from a Supabase Edge Function, not the browser)

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/schema.sql`. This creates the tables, RLS
   policies, and a couple of seed properties/rooms you can delete later.
3. In **Authentication → Users**, manually create one login per staff member
   (email + password). There's no public sign-up — that's intentional, since
   anyone logged in can create bookings and block rooms.
4. In **Project Settings → API**, copy your Project URL and `anon` public key.

## 2. Set up the WhatsApp Business API

You need a Meta WhatsApp Business API number (directly via Meta, or through a
provider like Gupshup, Interakt, or Twilio) and one **approved message template**
before this will actually send anything automatically — see PRD §10 for why.

Once you have that:

```bash
supabase functions deploy send-whatsapp
supabase secrets set WHATSAPP_API_URL=https://graph.facebook.com/v20.0/<phone-number-id>/messages
supabase secrets set WHATSAPP_ACCESS_TOKEN=<your-token>
supabase secrets set WHATSAPP_TEMPLATE_NAME=<your-approved-template-name>
```

The function expects your template to take exactly 4 body variables, in this
order: guest name, check-in date, check-out date, and "guests + room name".
If your approved template differs, adjust `templateParams` in
`supabase/functions/send-whatsapp/index.ts` to match.

**Before the WhatsApp piece is ready**, the app still works end to end — bookings
get created and rooms get blocked, the WhatsApp call will just fail gracefully
and the Admin > Bookings tab will show "Failed — message manually" so staff can
fall back to sending it themselves.

## 3. Run the app

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

Open the local URL, sign in with a staff account, and you're in.

## 4. Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages) — it's a plain Vite
build:

```bash
npm run build
```

Set the same two `VITE_SUPABASE_*` env vars in your host's dashboard.

## What's deliberately not here yet

Per the PRD, these are real future phases, not oversights:

- No online payment (Phase 2 — remote guest-facing booking)
- No commission/payout tracking beyond the `commission_rate` column already on
  `bookings` (P1)
- No Kayak Konnect activities section (Phase 3 — reserved in the PRD, not built)
- No partner self-serve portal (Phase 4)

## Project structure

```
src/
  lib/            Supabase client, availability-overlap helper
  hooks/          useAuth
  components/     Header, PropertyCard, BookingForm, AdminBookings, AdminProperties
  pages/          Login, PropertyList, PropertyDetail, Admin
supabase/
  schema.sql              tables + RLS policies + seed data
  functions/send-whatsapp Edge Function that calls the WhatsApp Business API
```
