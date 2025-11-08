const pool = require('../config/db');

class BaseRepository {
    constructor(tableName = '') {
        this.tableName = tableName;
        this.pool = pool;
    }

    async query(sql, params = []) {
        try {
            const result = await this.pool.query(sql, params);
            return result.rows;
        } catch (error) {
            console.error(`Database query error in ${this.constructor.name}:`, error);
            throw error;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }

    async findById(id) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
        const result = await this.query(query, [id]);
        return result[0];
    }

    async findAll(conditions = {}, orderBy = 'id DESC') {
        let whereClause = '';
        const values = [];
        let paramCount = 0;

        Object.keys(conditions).forEach(key => {
            paramCount++;
            if (whereClause === '') {
                whereClause = `WHERE ${key} = $${paramCount}`;
            } else {
                whereClause += ` AND ${key} = $${paramCount}`;
            }
            values.push(conditions[key]);
        });

        const query = `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${orderBy}`;
        return await this.query(query, values);
    }

    async create(data) {
        const fields = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map((_, index) => `$${index + 1}`).join(', ');
        const values = Object.values(data);

        const query = `
            INSERT INTO ${this.tableName} (${fields})
            VALUES (${placeholders})
            RETURNING *
        `;
        const result = await this.query(query, values);
        return result[0];
    }

    async update(id, data) {
        const updates = Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const values = Object.values(data);
        values.push(id);

        const query = `
            UPDATE ${this.tableName}
            SET ${updates}
            WHERE id = $${values.length}
            RETURNING *
        `;
        const result = await this.query(query, values);
        return result[0];
    }

    async delete(id) {
        const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
        const result = await this.query(query, [id]);
        return result[0];
    }
}

module.exports = BaseRepository;