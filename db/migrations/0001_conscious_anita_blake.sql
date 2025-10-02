CREATE TYPE "public"."check_category" AS ENUM('seo', 'gpteo');--> statement-breakpoint
CREATE TYPE "public"."check_severity" AS ENUM('critical', 'high', 'medium', 'low', 'info');--> statement-breakpoint
CREATE TYPE "public"."finding_status" AS ENUM('pass', 'partial', 'fail', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."page_type" AS ENUM('homepage', 'product', 'category', 'policy', 'other');--> statement-breakpoint
CREATE TYPE "public"."scan_mode" AS ENUM('quick', 'standard', 'deep');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('queued', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('shopify', 'bigcommerce', 'woocommerce', 'magento', 'custom_api');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error', 'expired');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."verification_type" AS ENUM('dns_txt', 'file_upload', 'meta_tag');--> statement-breakpoint
CREATE TABLE "checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" "check_category" NOT NULL,
	"severity" "check_severity" DEFAULT 'medium' NOT NULL,
	"weight" integer DEFAULT 10 NOT NULL,
	"config" jsonb,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deprecated_at" timestamp,
	"deprecation_message" text,
	"docs_url" text,
	"fix_template" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checks_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"check_id" uuid NOT NULL,
	"status" "finding_status" NOT NULL,
	"score" numeric(5, 2),
	"message" text NOT NULL,
	"evidence" jsonb,
	"fix_suggestion" text,
	"fix_snippet" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"url" text NOT NULL,
	"final_url" text,
	"type" "page_type" DEFAULT 'other' NOT NULL,
	"status_code" integer,
	"redirect_chain" jsonb,
	"headers" jsonb,
	"html_snapshot" text,
	"json_ld" jsonb,
	"meta_tags" jsonb,
	"load_time_ms" integer,
	"size_bytes" integer,
	"used_headless_browser" boolean DEFAULT false,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scan_id" uuid NOT NULL,
	"total_pages" integer NOT NULL,
	"total_findings" integer NOT NULL,
	"pass_count" integer NOT NULL,
	"fail_count" integer NOT NULL,
	"warning_count" integer NOT NULL,
	"seo_score_breakdown" jsonb,
	"gpteo_score_breakdown" jsonb,
	"critical_issues" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "scan_summaries_scan_id_unique" UNIQUE("scan_id")
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"mode" "scan_mode" DEFAULT 'quick' NOT NULL,
	"seed_urls" jsonb NOT NULL,
	"status" "scan_status" DEFAULT 'queued' NOT NULL,
	"queued_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"seo_score" integer,
	"gpteo_score" integer,
	"score_breakdown" jsonb,
	"user_agent" text,
	"checks_version" text DEFAULT '1.0.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"status" "integration_status" DEFAULT 'connected' NOT NULL,
	"shop_domain" text NOT NULL,
	"shop_name" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"scopes" jsonb,
	"last_sync_at" timestamp,
	"error_message" text,
	"auto_scan_on_update" boolean DEFAULT false,
	"webhook_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"verification_id" uuid,
	"frequency" text NOT NULL,
	"cron_expression" text,
	"seed_urls" jsonb,
	"mode" text DEFAULT 'standard' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp NOT NULL,
	"email_on_complete" boolean DEFAULT true,
	"email_on_issues" boolean DEFAULT true,
	"webhook_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"type" "verification_type" NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"expected_value" text,
	"file_path" text,
	"meta_tag" text,
	"verified_at" timestamp,
	"last_checked_at" timestamp,
	"next_check_at" timestamp,
	"error_message" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_check_id_checks_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."checks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_summaries" ADD CONSTRAINT "scan_summaries_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scans" ADD CONSTRAINT "scans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_scans" ADD CONSTRAINT "scheduled_scans_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_scans" ADD CONSTRAINT "scheduled_scans_verification_id_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."verifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;