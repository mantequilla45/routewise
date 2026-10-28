import { query } from '../../lib/db';
import { log } from '../../lib/log';

// Table names come from information_schema, but quote them anyway so a table with an
// unusual name can't break the generated SQL.
function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

export async function describeDatabase() {
  const tables = await query<{ table_name: string; column_count: string }>(`
    SELECT
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tableData: Record<string, unknown> = {};

  for (const table of tables) {
    const tableName = table.table_name;
    try {
      const columns = await query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `,
        [tableName],
      );
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${quoteIdent(tableName)}`,
      );
      const data = await query(`SELECT * FROM ${quoteIdent(tableName)} LIMIT 100`);

      tableData[tableName] = {
        columns,
        rowCount: parseInt(countResult[0]?.count || '0', 10),
        data,
        columnCount: table.column_count,
      };
    } catch (error) {
      log.error(`Error fetching data for table ${tableName}:`, error);
      tableData[tableName] = {
        columns: [],
        rowCount: 0,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        columnCount: table.column_count,
      };
    }
  }

  return { tables: tables.map((t) => t.table_name), tableData };
}
