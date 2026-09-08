import postgres from "postgres";
import "dotenv/config";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);

  try {
    // Add status_order column to leads table
    await client.unsafe(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS status_order integer DEFAULT 0 NOT NULL;
    `);
    console.log("✓ Added status_order column to leads table");

    // Create inventory_status enum
    await client.unsafe(`
      DO $$ BEGIN
        CREATE TYPE inventory_status AS ENUM('in_stock', 'in_transit', 'on_order', 'reserved', 'sold');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ Created inventory_status enum");

    // Create quote_status enum
    await client.unsafe(`
      DO $$ BEGIN
        CREATE TYPE quote_status AS ENUM('draft', 'sent', 'accepted', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ Created quote_status enum");

    // Create vehicle_inventory table
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS vehicle_inventory (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        trim_id uuid NOT NULL REFERENCES trims(id),
        status inventory_status DEFAULT 'on_order' NOT NULL,
        location varchar(255),
        vin varchar(50),
        expected_date timestamp with time zone,
        reserved_by uuid REFERENCES leads(id),
        reserved_at timestamp with time zone,
        notes text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("✓ Created vehicle_inventory table");

    // Create quotes table
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS quotes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid NOT NULL REFERENCES leads(id),
        configuration_json jsonb,
        pdf_url varchar(500),
        status quote_status DEFAULT 'draft' NOT NULL,
        valid_until timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        sent_at timestamp with time zone
      );
    `);
    console.log("✓ Created quotes table");

    console.log("\nAll migrations applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
