const BaseRepository = require('./baseRepository');

class MusicEntityRepository extends BaseRepository {
    constructor() {
        super();
    }

    getBaseSelect() {
        return `
            SELECT
                me.id, me.type, me.name, me.entity_url, me.avatar_url,
                me.views, me.created_at, me.description,
                u.nickname as author_name,
                g.name as genre_name
        `;
    }

    getBaseJoins() {
        return `
            FROM music_entity me
            LEFT JOIN users u ON me.author_id = u.id
            LEFT JOIN genre g ON me.genre_id = g.id
        `;
    }

    getBaseConditions() {
        return ['me.status = $1'];
    }

    buildWhereClause(conditions) {
        return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    }

    async getAllNewReleases(limit = 5) {
        const conditions = [...this.getBaseConditions()];
        const whereClause = this.buildWhereClause(conditions);

        const query = `
            ${this.getBaseSelect()}
            ${this.getBaseJoins()}
            ${whereClause}
            ORDER BY me.created_at DESC
            LIMIT $2
        `;

        return await this.query(query, ['approved', limit]);
    }

    async findByType(type, limit = 10, orderBy = 'me.created_at DESC') {
        const conditions = [...this.getBaseConditions(), 'me.type = $2'];
        const whereClause = this.buildWhereClause(conditions);

        const query = `
            ${this.getBaseSelect()}
            ${this.getBaseJoins()}
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT $3
        `;

        return await this.query(query, ['approved', type, limit]);
    }

    async search(query, type = 'all', genre = 'all', sort = 'relevance', limit = 20) {
        const searchBuilder = new SearchQueryBuilder(this.getBaseSelect(), this.getBaseJoins());
        return await searchBuilder.buildAndExecute(query, type, genre, sort, limit);
    }

    async getAllGenres() {
        const query = 'SELECT name FROM genre ORDER BY name';
        const result = await this.query(query);
        return result.rows ? result.rows.map(row => row.name) : result.map(row => row.name);
    }

    async searchMusic(query, type = 'all', genre = 'all', sort = 'relevance', limit = 20) {
        return await this.search(query, type, genre, sort, limit);
    }
}

class SearchQueryBuilder {
    constructor(baseSelect, baseJoins) {
        this.baseSelect = baseSelect;
        this.baseJoins = baseJoins;
        this.conditions = ['me.status = $1'];
        this.params = ['approved'];
        this.paramCount = 1;
        this.searchParamIndex = null;
    }

    addSearchCondition(query) {
        if (query) {
            this.paramCount++;
            this.searchParamIndex = this.paramCount;
            this.conditions.push(`(
                me.name ILIKE $${this.paramCount} OR
                u.nickname ILIKE $${this.paramCount} OR
                g.name ILIKE $${this.paramCount} OR
                me.description ILIKE $${this.paramCount}
            )`);
            this.params.push(`%${query}%`);
        }
    }

    addTypeCondition(type) {
        if (type !== 'all') {
            this.paramCount++;
            this.conditions.push(`me.type = $${this.paramCount}`);
            this.params.push(type);
        }
    }

    addGenreCondition(genre) {
        if (genre !== 'all') {
            this.paramCount++;
            this.conditions.push(`g.name = $${this.paramCount}`);
            this.params.push(genre);
        }
    }

    buildOrderBy(sort) {
        switch (sort) {
            case 'views':
                return 'me.views DESC';
            case 'newest':
                return 'me.created_at DESC';
            case 'oldest':
                return 'me.created_at ASC';
            default:
                if (this.searchParamIndex) {
                    return `
                        CASE
                            WHEN me.name ILIKE $${this.searchParamIndex} THEN 1
                            WHEN u.nickname ILIKE $${this.searchParamIndex} THEN 2
                            ELSE 3
                        END,
                        me.views DESC
                    `;
                } else {
                    return 'me.views DESC';
                }
        }
    }

    buildAndExecute(query, type, genre, sort, limit) {
        this.addSearchCondition(query);
        this.addTypeCondition(type);
        this.addGenreCondition(genre);

        const whereClause = this.conditions.length > 0 ? `WHERE ${this.conditions.join(' AND ')}` : '';
        const orderBy = this.buildOrderBy(sort);

        this.paramCount++;
        this.params.push(limit);

        const searchQuery = `
            ${this.baseSelect}
            ${this.baseJoins}
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT $${this.paramCount}
        `;

        const repository = new BaseRepository();
        return repository.query(searchQuery, this.params);
    }
}

module.exports = MusicEntityRepository;