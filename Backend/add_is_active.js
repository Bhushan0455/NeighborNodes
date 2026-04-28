const db = require('./db');

async function run() {
    try {
        await db.query('ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
        console.log('Successfully added is_active column.');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        process.exit();
    }
}
run();
