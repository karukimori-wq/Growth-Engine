import fs from "node:fs";
import pg from "pg";

const connectionString = process.env.GROWTH_ENGINE_SOURCE_POSTGRES_URL?.trim();
if (!connectionString) throw new Error("GROWTH_ENGINE_SOURCE_POSTGRES_URL is required for canonical data migration.");

const { Pool } = pg;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 1 });
const sqlString = (value) => value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const sqlNumber = (value) => Number.isFinite(Number(value)) ? String(Number(value)) : "0";

try {
  const customers = (await pool.query("SELECT * FROM growth_customers ORDER BY created_at ASC")).rows;
  const reservations = (await pool.query("SELECT * FROM growth_reservations ORDER BY created_at ASC")).rows;
  const statements = [];

  for (const row of customers) {
    statements.push(`INSERT INTO growth_customers (id,workspace_id,lead_id,customer_number,name,display_name,contact_information,line_user_id,sns_accounts,source_channel,source_campaign_id,source_content_id,referred_by_customer_id,customer_status,first_purchase_at,last_purchase_at,total_revenue,purchase_count,created_at,updated_at) VALUES (${[
      row.id,row.workspace_id,row.lead_id,row.customer_number,row.name,row.display_name,JSON.stringify(row.contact_information ?? {}),row.line_user_id,JSON.stringify(row.sns_accounts ?? {}),row.source_channel,row.source_campaign_id,row.source_content_id,row.referred_by_customer_id,row.customer_status,row.first_purchase_at?.toISOString?.() ?? row.first_purchase_at,row.last_purchase_at?.toISOString?.() ?? row.last_purchase_at
    ].map(sqlString).join(",")},${sqlNumber(row.total_revenue)},${sqlNumber(row.purchase_count)},${sqlString(row.created_at?.toISOString?.() ?? row.created_at)},${sqlString(row.updated_at?.toISOString?.() ?? row.updated_at)}) ON CONFLICT(id) DO UPDATE SET workspace_id=excluded.workspace_id,lead_id=excluded.lead_id,customer_number=excluded.customer_number,name=excluded.name,display_name=excluded.display_name,contact_information=excluded.contact_information,line_user_id=excluded.line_user_id,sns_accounts=excluded.sns_accounts,source_channel=excluded.source_channel,source_campaign_id=excluded.source_campaign_id,source_content_id=excluded.source_content_id,referred_by_customer_id=excluded.referred_by_customer_id,customer_status=excluded.customer_status,first_purchase_at=excluded.first_purchase_at,last_purchase_at=excluded.last_purchase_at,total_revenue=excluded.total_revenue,purchase_count=excluded.purchase_count,created_at=excluded.created_at,updated_at=excluded.updated_at;`);
  }

  for (const row of reservations) {
    statements.push(`INSERT INTO growth_reservations (id,workspace_id,lead_id,customer_id,product_id,professional_studio_type,scheduled_start_at,scheduled_end_at,status,source_channel,campaign_id,content_id,payment_status,session_id,created_at,updated_at) VALUES (${[
      row.id,row.workspace_id,row.lead_id,row.customer_id,row.product_id,row.professional_studio_type,row.scheduled_start_at?.toISOString?.() ?? row.scheduled_start_at,row.scheduled_end_at?.toISOString?.() ?? row.scheduled_end_at,row.status,row.source_channel,row.campaign_id,row.content_id,row.payment_status,row.session_id,row.created_at?.toISOString?.() ?? row.created_at,row.updated_at?.toISOString?.() ?? row.updated_at
    ].map(sqlString).join(",")}) ON CONFLICT(id) DO UPDATE SET workspace_id=excluded.workspace_id,lead_id=excluded.lead_id,customer_id=excluded.customer_id,product_id=excluded.product_id,professional_studio_type=excluded.professional_studio_type,scheduled_start_at=excluded.scheduled_start_at,scheduled_end_at=excluded.scheduled_end_at,status=excluded.status,source_channel=excluded.source_channel,campaign_id=excluded.campaign_id,content_id=excluded.content_id,payment_status=excluded.payment_status,session_id=excluded.session_id,created_at=excluded.created_at,updated_at=excluded.updated_at;`);
  }

  if (statements.length === 0) statements.push("SELECT 1;");
  fs.writeFileSync("/tmp/growth-postgres-to-d1.sql", statements.join("\n"), { mode: 0o600 });
  fs.writeFileSync("/tmp/growth-migration-manifest.json", JSON.stringify({ customerCount: customers.length, reservationCount: reservations.length }), { mode: 0o600 });
  console.log(`Prepared canonical migration: customers=${customers.length}, reservations=${reservations.length}. No record contents were logged.`);
} finally {
  await pool.end();
}
