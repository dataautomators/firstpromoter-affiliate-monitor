# FirstPromoter Frontend

## Setup

Copy `.env.example` to `.env` and set the variables.

## Run

Install dependencies:

```
pnpm install
```

Run the server:

```
pnpm dev
```

Open http://localhost:3000 in your browser.

## Environment Variables

- `NEXT_PUBLIC_API_URL` is the URL of the API.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is the publishable key for Clerk.
- `CLERK_SECRET_KEY` is the secret key for Clerk.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` is the sign-in URL for Clerk.
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` is the sign-up URL for Clerk.
