import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../config/database';

async function initializeDatabase() {
  try {
    // Read the SQL file
    const sql = readFileSync(join(__dirname, 'init.sql'), 'utf8');
    
    // Execute the SQL commands
    await pool.query(sql);
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase(); 