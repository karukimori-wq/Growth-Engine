import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | undefined;

function getConnectionString() {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL
  );
}

function normalizeConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    url.searchParams.delete("sslrootcert");
    return url.toString();
  } catch {
    return connectionString;
  }
}

export function hasPostgresConnectionString() {
  return Boolean(getConnectionString());
}

function getPool() {
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error("Postgres connection env is not configured.");
  }

  pool ??= new Pool({
    connectionString: normalizeConnectionString(connectionString),
    ssl: connectionString.includes("sslmode=disable") ? undefined : { rejectUnauthorized: false },
    max: 3
  });

  return pool;
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}
