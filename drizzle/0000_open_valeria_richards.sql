CREATE TYPE "public"."lead_status" AS ENUM('new', 'assigned', 'contacted', 'needs_follow_up', 'qualified', 'quote_sent', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"before_json" jsonb,
	"after_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"country" varchar(100),
	"logo_url" text,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "calculation_rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country" varchar(100) NOT NULL,
	"condition" varchar(50) NOT NULL,
	"powertrain" varchar(50) NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	"parameters_json" jsonb NOT NULL,
	"formula_version" varchar(50) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_color_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"color_option_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"alt" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"alternative_names" jsonb DEFAULT '[]'::jsonb,
	"body_type" varchar(50),
	"description" text,
	"short_description" text,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "car_models_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "color_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"color_option_id" uuid NOT NULL,
	"trim_id" uuid NOT NULL,
	"price_delta" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuration_option_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trim_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuration_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100),
	"image_url" text,
	"price_delta" numeric(12, 2),
	"price_currency" varchar(3) DEFAULT 'USD',
	"price_known" boolean DEFAULT true NOT NULL,
	"available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content_html" text,
	"seo_title" varchar(255),
	"seo_description" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"phone_normalized" varchar(50),
	"telegram" varchar(255),
	"whatsapp" varchar(255),
	"email" varchar(255),
	"preferred_contact_method" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"rate" numeric(12, 6) NOT NULL,
	"source" varchar(100),
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_urls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(500) NOT NULL,
	"source_site" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid,
	"type" varchar(100) NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"brand_name" varchar(255),
	"model_name" varchar(255),
	"model_version_name" varchar(255),
	"trim_name" varchar(255),
	"source_country" varchar(100),
	"condition" varchar(50),
	"configuration_json" jsonb,
	"source_price" numeric(12, 2),
	"source_currency" varchar(3),
	"logistics_cost" numeric(12, 2),
	"customs_cost" numeric(12, 2),
	"service_fee" numeric(12, 2),
	"other_costs" numeric(12, 2),
	"estimated_total" numeric(12, 2),
	"exchange_rate" numeric(12, 6),
	"calculator_rule_version" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"assigned_manager_id" uuid,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"source" varchar(100),
	"trim_id" uuid,
	"estimated_total_usd" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"comment" text,
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_contact_at" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "model_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_model_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"generation_code" varchar(100),
	"model_year_from" integer,
	"model_year_to" integer,
	"production_status" varchar(50),
	"default_source_country" varchar(100),
	"seats" integer,
	"doors" integer,
	"seo_title" varchar(255),
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"city" varchar(100),
	"rating" integer,
	"vehicle_label" varchar(255),
	"text" text,
	"image_url" text,
	"video_url" text,
	"social_url" text,
	"published" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value_json" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specification_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"data_type" varchar(50) DEFAULT 'string' NOT NULL,
	"unit" varchar(50),
	"comparison_priority" integer DEFAULT 0 NOT NULL,
	"filterable" boolean DEFAULT false NOT NULL,
	CONSTRAINT "specification_definitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "specification_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "specification_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "trim_specification_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trim_id" uuid NOT NULL,
	"specification_definition_id" uuid NOT NULL,
	"value_text" text,
	"value_number" numeric(12, 4),
	"value_boolean" boolean,
	"source_note" text
);
--> statement-breakpoint
CREATE TABLE "trims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_version_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"powertrain_type" varchar(50),
	"drivetrain" varchar(50),
	"engine_displacement_cc" integer,
	"engine_power_hp" integer,
	"motor_power_kw" integer,
	"battery_capacity_kwh" numeric(6, 2),
	"range_km" integer,
	"acceleration_0_100" numeric(4, 2),
	"top_speed_kmh" integer,
	"base_price" numeric(12, 2),
	"base_price_currency" varchar(3) DEFAULT 'USD',
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trims_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "used_vehicle_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"vin" varchar(17),
	"manufacture_date" timestamp,
	"first_registration_date" timestamp,
	"mileage_km" integer,
	"owners_count" integer,
	"auction_grade" varchar(10),
	"accident_status" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'manager' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_version_id" uuid NOT NULL,
	"trim_id" uuid,
	"type" varchar(50) DEFAULT 'exterior' NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"alt" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trim_id" uuid NOT NULL,
	"source_country" varchar(100),
	"condition" varchar(50),
	"model_year" integer,
	"mileage_km" integer,
	"source_price" numeric(12, 2),
	"source_currency" varchar(3) DEFAULT 'USD',
	"price_basis" varchar(50),
	"estimated_logistics" numeric(12, 2),
	"estimated_customs" numeric(12, 2),
	"estimated_service_fee" numeric(12, 2),
	"estimated_total_usd" numeric(12, 2),
	"delivery_days" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_color_images" ADD CONSTRAINT "car_color_images_color_option_id_configuration_options_id_fk" FOREIGN KEY ("color_option_id") REFERENCES "public"."configuration_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_pricing" ADD CONSTRAINT "color_pricing_color_option_id_configuration_options_id_fk" FOREIGN KEY ("color_option_id") REFERENCES "public"."configuration_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "color_pricing" ADD CONSTRAINT "color_pricing_trim_id_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."trims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configuration_option_groups" ADD CONSTRAINT "configuration_option_groups_trim_id_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."trims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "configuration_options" ADD CONSTRAINT "configuration_options_group_id_configuration_option_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."configuration_option_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_configurations" ADD CONSTRAINT "lead_configurations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_manager_id_users_id_fk" FOREIGN KEY ("assigned_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_trim_id_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."trims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_car_model_id_car_models_id_fk" FOREIGN KEY ("car_model_id") REFERENCES "public"."car_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specification_definitions" ADD CONSTRAINT "specification_definitions_group_id_specification_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."specification_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trim_specification_values" ADD CONSTRAINT "trim_specification_values_trim_id_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."trims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trim_specification_values" ADD CONSTRAINT "trim_specification_values_specification_definition_id_specification_definitions_id_fk" FOREIGN KEY ("specification_definition_id") REFERENCES "public"."specification_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trims" ADD CONSTRAINT "trims_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "used_vehicle_details" ADD CONSTRAINT "used_vehicle_details_offer_id_vehicle_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."vehicle_offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD CONSTRAINT "vehicle_media_model_version_id_model_versions_id_fk" FOREIGN KEY ("model_version_id") REFERENCES "public"."model_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_media" ADD CONSTRAINT "vehicle_media_trim_id_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."trims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_offers" ADD CONSTRAINT "vehicle_offers_trim_id_trims_id_fk" FOREIGN KEY ("trim_id") REFERENCES "public"."trims"("id") ON DELETE no action ON UPDATE no action;