# Security Path Learning App

Editable source for https://www.blvbtc.com/kali-linux-learning/.

The parent directory is the existing static website. Its exchange homepage,
tutorials, typing practice and other tools are independent of this app.

## Run locally

Use Node.js 22.12 or later. From this directory:

```sh
npm ci
npm run dev
```

The app provides four Linux paths, course chapters and quizzes, offline
simulated exercises, a Chinese command handbook, browser-local notes, and
CISP / CISSP / OSCP+ skill maps with original scenario questions.

## Verify and build

```sh
npm test
npm run build
```

Build the deployable app directly into the existing static app directory:

```sh
npm run build:deploy
```

Review and commit `learning-app/` and the generated changes in
`kali-linux-learning/`, then push to the repository's production branch.
The existing Vercel Git integration publishes that commit. The deploy build
keeps older hashed assets so already-open pages can still load their assets.
Do not deploy the app build into the root of the static website.

## Configuration and data

Copy `.env.example` to `.env.local` for a different Supabase project. Only
publishable/anon keys belong in browser configuration. The database schema
and row-level-security policies are in `supabase/schema.sql`.

Courses and missions can synchronize to a signed-in user's Supabase record.
Guest progress and account caches use separate browser storage. Loading an
unknown account starts with an empty record; it never imports another user's
progress. Cloud read failures do not overwrite remote data. Notes and
certification self-assessments remain local to the browser; self-assessments
are namespaced by signed-in user or guest and do not award course XP.

Learning time includes timed sessions, manual entries and estimates for
completed courses. It is not a measured weekly activity or attendance streak.

## Certification content

The original training recommendations are in `src/data/certifications.js`.
Each skill has a scenario, suggested steps, acceptance evidence, coverage
limits and optional links into real course/case IDs. Official references and
their review date are included in the page. CISSP covers all eight domain
headings and weights. CISP uses our own suggested training groups. OSCP+
explicitly identifies missing Windows, AD, credentials, exploitation and
tunneling labs. This app is neither an official question bank nor a complete
exam simulation, and completion does not establish certification eligibility.
