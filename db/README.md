# GPTeo Database

## ✅ Schema Complete

The database schema for GPTeo has been successfully created with **9 tables** across 3 domains:

### Core Domains

1. **Scans Domain** (4 tables)
   - `scans` - Main scan records with SEO/GPTeo scores
   - `pages` - Individual pages scanned
   - `findings` - Check results per page
   - `scan_summaries` - Aggregated statistics

2. **Checks Domain** (1 table)
   - `checks` - Versioned registry of SEO & GPTeo checks (25 initial checks included)

3. **Verification & Integration Domain** (3 tables)
   - `verifications` - Domain ownership proofs (DNS TXT, file upload, meta tag)
   - `integrations` - OAuth connections (Shopify, BigCommerce, etc.)
   - `scheduled_scans` - Recurring scan configurations

4. **Existing**
   - `customers` - User/customer data with Stripe integration

---

## 🗂️ Initial Checks Registry

**SEO Checks (10):**
- Title & meta tags
- Canonical URLs
- Robots.txt & sitemap
- H1 headings
- OpenGraph tags
- Performance heuristics

**GPTeo Checks (15):**
- Product JSON-LD schema
- Offer completeness
- Product identifiers (GTIN/SKU)
- Provenance & brand trust
- Policy transparency
- Freshness signals
- AI feed availability
- Content attributes

---

## 📊 Scoring System

- **SEO Score**: 0-100 (weighted checks across meta, canonicals, robots, performance)
- **GPTeo Score**: 0-100 (weighted checks across schema, identifiers, freshness, feeds)
- **Partial Credit**: Checks can score 0-100 based on completeness

---

## 🚀 Next Steps

### 1. Push to Database

```bash
npm run db:migrate
```

### 2. Seed Initial Data

```bash
npm run db:seed
```

This will populate the `checks` table with 25 initial checks.

### 3. Verify Schema

```bash
npx supabase start
```

Then visit the Supabase Studio to inspect tables.

---

## 📚 Documentation

- **Schema Details**: See [SCHEMA.md](./SCHEMA.md) for complete documentation
- **Migrations**: Located in `db/migrations/`
- **Seed Data**: Located in `db/seed/data/`

---

## 🔄 Workflow

1. Customer submits scan → `scans` table (status: `queued`)
2. Worker picks up scan → crawls URLs → `pages` table
3. Checks run against pages → `findings` table
4. Scores computed → update `scans.seo_score`, `scans.gpteo_score`
5. Summary generated → `scan_summaries` table
6. Status updated → `scans.status = 'completed'`

---

## 🎯 Ready for Phase 2

With the database schema complete, you're ready to build:

- **Scan submission UI** (dashboard page)
- **Background job queue** (BullMQ or similar)
- **Crawler/analyzer** (HTTP fetcher + Playwright)
- **Check handlers** (implement check logic)
- **Results UI** (dual scores + findings)

---

## 💡 Tips

- Run `npm run types` to verify TypeScript types
- All schema exports are available from `db/index.ts`
- Use Drizzle relations for easy joins
- Check SCHEMA.md for recommended indexes

---

**Status**: ✅ Database schema complete and ready for migration

