CREATE TYPE "public"."inventory_status" AS ENUM('in_stock', 'in_transit', 'on_order', 'reserved', 'sold');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'accepted', 'expired');--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"configuration_json" jsonb,
	"pdf_url" varchar(500),
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vehicle_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trim_id" uuid NOT NULL,
	"status" "inventory_status" DEFAULT 'on_order' NOT NULL,
	"location" varchar(255),
	"vin" varchar(50),
	"expected_date" timestamp with time zone,
	"reserved_by" uuid,
	"reserved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "status_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD CONSTRAINT "vehicle_inventory_trim_id_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."trims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD CONSTRAINT "vehicle_inventory_reserved_by_leads_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;