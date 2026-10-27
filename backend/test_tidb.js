const mysql = require('mysql2/promise');

async function testTiDB() {
  try {
    console.log('Connecting to TiDB Cloud...');
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2MMZ3bZGCHjw5Bt.root',
      password: 'm1F0ie0iZuh278mZ',
      database: 'sys',
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    });

    console.log('✅ Connected successfully to TiDB Cloud!');
    const [rows] = await connection.query('SELECT VERSION() as version, DATABASE() as db, NOW() as curr_time');
    console.log('Query result:', rows[0]);

    // Check databases
    const [dbs] = await connection.query('SHOW DATABASES');
    console.log('Available databases:', dbs.map(d => Object.values(d)[0]));

    // Create database wormdonz if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS wormdonz');
    console.log('✅ Database "wormdonz" verified/created!');

    await connection.end();
  } catch (err) {
    console.error('❌ TiDB Connection Error:', err.message);
  }
}

testTiDB();
