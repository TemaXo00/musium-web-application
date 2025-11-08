const BaseRepository = require('./baseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async create(userData) {
        const query = `
            INSERT INTO users (nickname, email, password_hash, type, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, nickname, email, type, created_at
        `;
        const values = [userData.nickname, userData.email, userData.password_hash, userData.type];
        const result = await this.query(query, values);
        return result[0];
    }

    async findByEmail(email) {
        const query = this.buildProfileQuery('u.email = $1');
        const result = await this.query(query, [email]);
        return result[0] || null;
    }

    async findByNickname(nickname) {
        const query = this.buildProfileQuery('u.nickname = $1');
        const result = await this.query(query, [nickname]);
        return result[0] || null;
    }

    async findById(id) {
        const query = this.buildProfileQuery('u.id = $1');
        const result = await this.query(query, [id]);
        return result[0] || null;
    }

    async getUserWithPasswordByEmail(email) {
        const query = `
            SELECT
                u.id,
                u.nickname,
                u.email,
                u.password_hash,
                u.type,
                u.created_at,
                uph.avatar_url,
                uph.description
            FROM users u
                     LEFT JOIN user_profile_history uph ON u.id = uph.user_id
            WHERE u.email = $1
            ORDER BY uph.updated_at DESC
            LIMIT 1
        `;
        const result = await this.query(query, [email]);
        return result[0] || null;
    }

    async createProfileHistory(userId) {
        const query = `
            INSERT INTO user_profile_history (user_id, updated_at)
            VALUES ($1, NOW())
            RETURNING *
        `;
        const result = await this.query(query, [userId]);
        return result[0];
    }

    async deleteUser(userId) {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
        const result = await this.query(query, [userId]);
        return result[0];
    }

    async getAllUsers() {
        const query = this.buildDistinctProfileQuery();
        return await this.query(query);
    }

    async searchByNickname(nickname) {
        const query = this.buildDistinctProfileQuery('u.nickname ILIKE $1');
        return await this.query(query, [`%${nickname}%`]);
    }

    async getUserProfile(userId) {
        const query = this.buildProfileQuery('u.id = $1', true);
        const result = await this.query(query, [userId]);
        const profile = result[0] || null;

        if (profile) {
            this.formatProfile(profile);
        }

        return profile;
    }

    async updateProfileHistory(userId, profileData) {
        const query = `
            INSERT INTO user_profile_history (user_id, avatar_url, gender, description, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *
        `;
        const values = [userId, profileData.avatar_url, profileData.gender, profileData.description];
        const result = await this.query(query, values);
        return result[0];
    }

    async getProfileHistory(userId) {
        const query = `
            SELECT
                id,
                avatar_url,
                gender,
                description,
                updated_at
            FROM user_profile_history
            WHERE user_id = $1
            ORDER BY updated_at DESC
        `;
        return await this.query(query, [userId]);
    }

    async isEmailExists(email, excludeUserId = null) {
        return await this.checkFieldExists('email', email, excludeUserId);
    }

    async isNicknameExists(nickname, excludeUserId = null) {
        return await this.checkFieldExists('nickname', nickname, excludeUserId);
    }

    async getUserWithPassword(userId) {
        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await this.query(query, [userId]);
        return result[0] || null;
    }

    buildProfileQuery(whereCondition, single = false) {
        const baseQuery = `
            SELECT
                u.id,
                u.nickname,
                u.email,
                u.type${single ? ' as status' : ''},
                u.created_at,
                uph.avatar_url,
                uph.description${single ? ', uph.gender' : ''}
            FROM users u
                     LEFT JOIN user_profile_history uph ON u.id = uph.user_id
            WHERE ${whereCondition}
            ORDER BY uph.updated_at DESC
                ${single ? 'LIMIT 1' : ''}
        `;
        return baseQuery;
    }

    buildDistinctProfileQuery(whereCondition = null) {
        let whereClause = '';
        if (whereCondition) {
            whereClause = `WHERE ${whereCondition}`;
        }

        return `
            SELECT DISTINCT ON (u.id)
                u.id,
                u.nickname,
                u.email,
                u.type,
                u.created_at,
                uph.avatar_url,
                uph.description
            FROM users u
                     LEFT JOIN user_profile_history uph ON u.id = uph.user_id
                ${whereClause}
            ORDER BY u.id, uph.updated_at DESC NULLS LAST
        `;
    }

    formatProfile(profile) {
        profile.formatted_created_at = this.formatDate(profile.created_at);
        profile.avatar_url = profile.avatar_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_GrWvA5oKbxeiALyR8O5xG6zkVxgFVFQpQw&s';
        profile.gender = profile.gender || 'N/A';
        profile.description = profile.description || 'No description provided';
    }

    async checkFieldExists(field, value, excludeUserId = null) {
        let query = `SELECT id FROM users WHERE ${field} = $1`;
        let params = [value];

        if (excludeUserId) {
            query += ' AND id != $2';
            params.push(excludeUserId);
        }

        const result = await this.query(query, params);
        return result.length > 0;
    }
}

module.exports = UserRepository;