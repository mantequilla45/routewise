import { query } from '../lib/db/db';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function removeReverseColumn() {
    console.log('========== REMOVING GEOM_REVERSE COLUMN ==========\n');
    
    try {
        // 1. Check if column exists
        console.log('1. Checking if geom_reverse column exists...');
        const columnCheck = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'jeepney_routes' 
            AND column_name = 'geom_reverse';
        `);
        
        if (columnCheck.length === 0) {
            console.log('✓ Column geom_reverse does not exist. Nothing to do.');
            return;
        }
        
        console.log('Column geom_reverse exists. Proceeding with removal...\n');
        
        // 2. Drop the column
        console.log('2. Dropping geom_reverse column...');
        await query(`
            ALTER TABLE jeepney_routes 
            DROP COLUMN IF EXISTS geom_reverse;
        `);
        console.log('✓ Column removed successfully\n');
        
        // 3. Verify removal
        console.log('3. Verifying table structure...');
        const columns = await query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable
            FROM information_schema.columns
            WHERE table_name = 'jeepney_routes'
            ORDER BY ordinal_position;
        `);
        
        console.log('Current table structure:');
        console.table(columns);
        
        console.log('\n✓ Migration completed successfully!');
        console.log('The geom_reverse column has been removed.');
        console.log('Each route now has only one direction defined by geom_forward.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\nIf you want to manually remove the column, run this SQL:');
        console.log('ALTER TABLE jeepney_routes DROP COLUMN IF EXISTS geom_reverse;');
    }
    
    process.exit(0);
}

// Run the migration
removeReverseColumn();