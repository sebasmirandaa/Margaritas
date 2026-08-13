const { BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');

module.exports = async function usePostgresAuthState(pool) {
    // Asegurar tabla
    await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_state (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL
        )
    `);

    const writeData = async (data, id) => {
        const str = JSON.stringify(data, BufferJSON.replacer);
        await pool.query(
            `INSERT INTO auth_state (id, data) VALUES ($1, $2::jsonb) 
             ON CONFLICT (id) DO UPDATE SET data = $2::jsonb`,
            [id, str]
        );
    };

    const readData = async (id) => {
        const res = await pool.query(`SELECT data FROM auth_state WHERE id = $1`, [id]);
        if (res.rows.length > 0) {
            return JSON.parse(JSON.stringify(res.rows[0].data), BufferJSON.reviver);
        }
        return null;
    };

    const removeData = async (id) => {
        await pool.query(`DELETE FROM auth_state WHERE id = $1`, [id]);
    };

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'appStateSyncKey' && value) {
                                value = require('@whiskeysockets/baileys').proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => writeData(creds, 'creds'),
        clearState: async () => {
            await pool.query(`DELETE FROM auth_state`);
        }
    };
};
