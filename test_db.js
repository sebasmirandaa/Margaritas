const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.jdeoithdakijzstdbwny:WWIGYXF16fJNhgZb@aws-0-us-east-2.pooler.supabase.com:5432/postgres'
});

async function test() {
    try {
        await client.connect();
        console.log("CONEXION EXITOSA AL SESSION POOLER!");
        const res = await client.query('SELECT NOW()');
        console.log("Hora de la DB:", res.rows[0].now);
        await client.end();
    } catch (e) {
        console.error("ERROR DE CONEXION POOLER:", e.message);
    }
}
test();
