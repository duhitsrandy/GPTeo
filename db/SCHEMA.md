# GPTeo Database Schema

This document describes the database schema for the GPTeo SaaS platform.

## Overview

The schema is organized into three main domains:

1. **Scans** - Core scanning functionality (scans, pages, findings, summaries)
2. **Checks** - Versioned registry of SEO and GPTeo checks
3. **Verifications** - Domain ownership, integrations, and scheduled scans

---

## Core Tables

### `customers`
Stores customer/user information with Stripe integration.

**Key Fields:**
- `user_id` - Links to Clerk authentication
- `membership` - Enum: `free`, `pro`
- `stripe_customer_id`, `stripe_subscription_id` - Stripe integration

---

## Scan Domain

### `scans`
Main scan records initiated by customers.

**Key Fields:**
- `customer_id` - Foreign key to customers
- `domain` - Normalized domain (no protocol)
- `mode` - Enum: `quick`, `standard`, `deep`
- `seed_urls` - Array of URLs to scan (JSON)
- `status` - Enum: `queued`, `running`, `completed`, `failed`, `cancelled`
- `seo_score`, `gpteo_score` - Computed scores (0-100)
- `score_breakdown` - Detailed category scores (JSON)
- `checks_version` - Version of checks used (for historical comparison)

**Workflow:**
1. Customer submits domain + seed URLs
2. Scan queued with status `queued`
3. Worker picks up scan, sets status to `running`
4. Pages crawled → `pages` table
5. Checks run → `findings` table
6. Scores computed → `scans.seo_score`, `scans.gpteo_score`
7. Summary generated → `scan_summaries` table
8. Status set to `completed`

### `pages`
Individual pages scanned within a scan.

**Key Fields:**
- `scan_id` - Foreign key to scans
- `url` - Original URL requested
- `final_url` - URL after redirects
- `type` - Enum: `homepage`, `product`, `category`, `policy`, `other`
- `status_code` - HTTP status
- `json_ld` - Extracted JSON-LD blocks (JSON array)
- `meta_tags` - Extracted meta tags (JSON object)
- `html_snapshot` - Full HTML (nullable for free tier)
- `used_headless_browser` - Boolean flag for cost tracking

**Performance Fields:**
- `load_time_ms` - Page load time
- `size_bytes` - Total page size

### `findings`
Individual check results for each page.

**Key Fields:**
- `page_id` - Foreign key to pages
- `check_id` - Foreign key to checks
- `status` - Enum: `pass`, `partial`, `fail`, `warning`, `info`
- `score` - Decimal (0-100) for partial credit
- `message` - Human-readable result
- `evidence` - JSON object with:
  - `snippet` - Code/HTML showing the issue
  - `location` - CSS selector or JSON path
  - `found` - What was actually found
  - `expected` - What should be there
- `fix_suggestion` - Textual explanation
- `fix_snippet` - Copy-paste code fix

### `scan_summaries`
Aggregated statistics for a scan.

**Key Fields:**
- `scan_id` - One-to-one with scans
- `total_pages`, `total_findings` - Counts
- `pass_count`, `fail_count`, `warning_count` - Status counts
- `seo_score_breakdown`, `gpteo_score_breakdown` - Category details (JSON)
- `critical_issues` - Top 5 issues (JSON array)

---

## Checks Domain

### `checks`
Registry of all available checks (versioned).

**Key Fields:**
- `key` - Unique identifier (e.g., `seo.meta.title`)
- `name` - Human-readable name
- `description` - What the check does
- `category` - Enum: `seo`, `gpteo`
- `severity` - Enum: `critical`, `high`, `medium`, `low`, `info`
- `weight` - Contribution to category score (default: 10)
- `config` - JSON object with check-specific settings:
  - `pageTypes` - Which page types this applies to
  - `requiredFields` - Required data fields
  - `thresholds` - Numeric thresholds
- `version` - Semantic version (e.g., `1.0.0`)
- `is_active` - Boolean flag for enabling/disabling
- `deprecated_at` - Timestamp when deprecated
- `fix_template` - Default fix suggestion

**Check Lifecycle:**
1. New check added with `is_active: false`
2. Tested in development
3. Rolled out to beta customers
4. Promoted to `is_active: true`
5. Eventually deprecated with `deprecated_at` set

---

## Verification & Integration Domain

### `verifications`
Domain ownership proofs.

**Key Fields:**
- `customer_id` - Foreign key to customers
- `domain` - Normalized domain
- `type` - Enum: `dns_txt`, `file_upload`, `meta_tag`
- `status` - Enum: `pending`, `verified`, `failed`, `expired`
- `token` - Generated token to verify
- `expected_value` - For DNS TXT records
- `file_path` - For file upload (e.g., `/.well-known/gpteo-verify.txt`)
- `verified_at`, `expires_at` - Timestamps

**Verification Flow:**
1. Customer requests verification
2. System generates unique `token`
3. Customer adds DNS TXT / uploads file / adds meta tag
4. System checks for token presence
5. Status updated to `verified`

### `integrations`
OAuth connections to e-commerce platforms.

**Key Fields:**
- `customer_id` - Foreign key to customers
- `provider` - Enum: `shopify`, `bigcommerce`, `woocommerce`, `magento`, `custom_api`
- `status` - Enum: `connected`, `disconnected`, `error`, `expired`
- `shop_domain`, `shop_name` - Store identification
- `access_token`, `refresh_token` - OAuth credentials (encrypted)
- `scopes` - Array of granted permissions (JSON)
- `auto_scan_on_update` - Trigger scan on product change
- `webhook_url` - For platform webhooks

**Security Note:**
Tokens should be encrypted at rest using Supabase encryption or AWS KMS.

### `scheduled_scans`
Recurring scan configurations.

**Key Fields:**
- `customer_id` - Foreign key to customers
- `domain` - Target domain
- `verification_id` - Optional foreign key (for verified domains)
- `frequency` - String: `daily`, `weekly`, `monthly`
- `cron_expression` - For custom schedules
- `seed_urls` - URLs to scan (JSON array)
- `mode` - Scan mode: `quick`, `standard`, `deep`
- `is_active` - Enable/disable schedule
- `last_run_at`, `next_run_at` - Timestamps
- `email_on_complete`, `email_on_issues` - Notification preferences
- `webhook_url` - POST scan results

---

## Scoring Algorithm

### SEO Score (0-100)
Weighted sum of SEO checks:
- Meta tags & title: 25 points
- Canonicals & indexability: 25 points
- Robots.txt & sitemap: 15 points
- Content structure: 10 points
- Social tags: 5 points
- Performance: 20 points

### GPTeo Score (0-100)
Weighted sum of GPTeo checks:
- Product JSON-LD completeness: 30 points
- Offer schema: 15 points
- Identifiers (GTIN/SKU): 10 points
- Provenance & trust: 15 points
- Policy transparency: 15 points
- Freshness signals: 10 points
- AI feed availability: 5 points

**Partial Credit:**
Checks can return scores between 0-100:
- `pass` = 100
- `partial` = 50-99 (depending on how many fields are present)
- `fail` = 0
- `warning` = doesn't affect score
- `info` = doesn't affect score

---

## Migrations

Generate new migrations after schema changes:

```bash
npx drizzle-kit generate
```

Push to database:

```bash
npx drizzle-kit push
```

Run migrations:

```bash
npx drizzle-kit migrate
```

---

## Seeding

Seed the database with initial data:

```bash
npx bun db/seed
```

This populates:
- **checks** table with initial SEO and GPTeo checks
- **customers** table with test data

---

## Indexes (to be added)

Recommended indexes for performance:

```sql
-- Scans
CREATE INDEX idx_scans_customer_id ON scans(customer_id);
CREATE INDEX idx_scans_domain ON scans(domain);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

-- Pages
CREATE INDEX idx_pages_scan_id ON pages(scan_id);
CREATE INDEX idx_pages_type ON pages(type);

-- Findings
CREATE INDEX idx_findings_page_id ON findings(page_id);
CREATE INDEX idx_findings_check_id ON findings(check_id);
CREATE INDEX idx_findings_status ON findings(status);

-- Verifications
CREATE INDEX idx_verifications_domain ON verifications(domain);
CREATE INDEX idx_verifications_status ON verifications(status);

-- Scheduled Scans
CREATE INDEX idx_scheduled_scans_next_run_at ON scheduled_scans(next_run_at) WHERE is_active = true;
```

---

## Future Enhancements

### Version 2 Tables (planned):

1. **`scan_history`** - Track score deltas over time
2. **`alerts`** - User-defined alert rules (e.g., "notify me if GPTeo score drops below 80")
3. **`api_keys`** - For API access to scan results
4. **`webhooks`** - Custom webhook configurations
5. **`teams`** - Multi-user team support
6. **`exports`** - Track PDF/CSV export requests

---

## Relations Diagram

```
customers
  ├── scans (1:many)
  │   ├── pages (1:many)
  │   │   └── findings (1:many)
  │   │       └── check (many:1)
  │   └── scan_summaries (1:1)
  ├── verifications (1:many)
  ├── integrations (1:many)
  └── scheduled_scans (1:many)
      └── verification (optional many:1)

checks (standalone, versioned)
```

---

## Notes

- All timestamps use PostgreSQL `timestamp` (without timezone by default)
- UUIDs used for all primary keys for better distribution
- JSON columns use `jsonb` for better query performance
- Soft deletes not implemented (use `CASCADE` deletes)
- Foreign keys use `onDelete: "cascade"` except for checks (`restrict`)

