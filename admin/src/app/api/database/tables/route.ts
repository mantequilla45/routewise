import { NextResponse } from 'next/server';
import { query } from '@/lib/db/db';

export async function GET() {
    try {
        // Get all tables in the public schema
        const tablesQuery = `
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        const tables = await query(tablesQuery);
        
        // Get row counts and sample data for each table
        const tableData: any = {};
        
        for (const table of tables) {
            const tableName = table.table_name;
            
            try {
                // Get columns info
                const columnsQuery = `
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns
                    WHERE table_name = $1
                    AND table_schema = 'public'
                    ORDER BY ordinal_position;
                `;
                const columns = await query(columnsQuery, [tableName]);
                
                // Get row count
                const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
                const countResult = await query(countQuery);
                const rowCount = parseInt(countResult[0]?.count || '0');
                
                // Get sample data (limit to 100 rows for performance)
                const dataQuery = `SELECT * FROM ${tableName} LIMIT 100`;
                const data = await query(dataQuery);
                
                tableData[tableName] = {
                    columns: columns,
                    rowCount: rowCount,
                    data: data,
                    columnCount: table.column_count
                };
            } catch (error) {
                console.error(`Error fetching data for table ${tableName}:`, error);
                tableData[tableName] = {
                    columns: [],
                    rowCount: 0,
                    data: [],
                    error: error instanceof Error ? error.message : 'Unknown error',
                    columnCount: table.column_count
                };
            }
        }

        return NextResponse.json({
            success: true,
            tables: tables.map(t => t.table_name),
            tableData: tableData
        });

    } catch (error) {
        console.error('Error fetching database info:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to fetch database info', 
                details: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}