const MusicEntityRepository = require('./musicEntityRepository');

class MusicRepository extends MusicEntityRepository {
    constructor() {
        super();
        this._pendingQueries = this._buildPendingQueries();
        this._typeMap = { song: 'Song', album: 'Album', ep: 'EP' };
    }

    _buildPendingQueries() {
        const baseQuery = `
            SELECT me.id, me.type, me.name, me.entity_url, me.avatar_url,
                   me.views, me.created_at, me.description,
                   u.nickname as author_name, g.name as genre_name
            FROM music_entity me
                     LEFT JOIN users u ON me.author_id = u.id
                     LEFT JOIN genre g ON me.genre_id = g.id
            WHERE me.status = 'pending' AND me.type = $1
            ORDER BY me.created_at DESC
        `;

        return {
            tracks: [baseQuery, ['Song']],
            albums: [baseQuery, ['Album']],
            eps: [baseQuery, ['EP']]
        };
    }

    async getNewReleases(limit = 5) {
        return this.getAllNewReleases(limit);
    }

    async getNewSongs(limit = 5) {
        return this.findByType('Song', limit, 'me.created_at DESC');
    }

    async getNewAlbums(limit = 5) {
        return this.findByType('Album', limit, 'me.created_at DESC');
    }

    async getNewEPs(limit = 5) {
        return this.findByType('EP', limit, 'me.created_at DESC');
    }

    async getTrendingSongs(limit = 10) {
        return this.findByType('Song', limit, 'me.views DESC');
    }

    async getTrendingAlbums(limit = 10) {
        return this.findByType('Album', limit, 'me.views DESC');
    }

    async getTrendingEPs(limit = 10) {
        return this.findByType('EP', limit, 'me.views DESC');
    }

    async getPendingTracks() {
        const [query, params] = this._pendingQueries.tracks;
        return this.query(query, params);
    }

    async getPendingAlbums() {
        const [query, params] = this._pendingQueries.albums;
        return this.query(query, params);
    }

    async getPendingEPs() {
        const [query, params] = this._pendingQueries.eps;
        return this.query(query, params);
    }

    async approveEntity(type, id) {
        const correctedType = this._typeMap[type.toLowerCase()] || type;
        return this.query(`
            UPDATE music_entity
            SET status = 'approved', updated_at = NOW(), reason = 'Approved by admin'
            WHERE id = $1 AND type = $2
            RETURNING id, name, status
        `, [id, correctedType]);
    }

    async rejectEntity(type, id, reason) {
        const correctedType = this._typeMap[type.toLowerCase()] || type;
        return this.query(`
            UPDATE music_entity
            SET status = 'declined', updated_at = NOW(), reason = $2
            WHERE id = $1 AND type = $3
            RETURNING id, name, status
        `, [id, reason, correctedType]);
    }

    async getEntityById(id) {
        const query = `
            ${this.getBaseSelect()}
            ${this.getBaseJoins()}
            WHERE me.id = $1 AND me.status = 'approved'
        `;

        const result = await this.query(query, [id]);
        return result[0] || null;
    }

    async getAlbumTracks(albumId) {
        const query = `
            SELECT at.id, at.name, at.url_link, at.track_order
            FROM album_tracks at
                     INNER JOIN album a ON at.album_id = a.id
                     INNER JOIN music_entity me ON a.music_entity_id = me.id
            WHERE me.id = $1 AND me.status = 'approved'
            ORDER BY at.track_order ASC
        `;

        return await this.query(query, [albumId]);
    }

    async getEpTracks(epId) {
        const query = `
            SELECT et.id, et.name, et.url_link, et.track_order
            FROM ep_tracks et
                     INNER JOIN ep e ON et.ep_id = e.id
                     INNER JOIN music_entity me ON e.music_entity_id = me.id
            WHERE me.id = $1 AND me.status = 'approved'
            ORDER BY et.track_order ASC
        `;

        return await this.query(query, [epId]);
    }

    async incrementViews(entityId) {
        const query = `
            UPDATE music_entity
            SET views = views + 1
            WHERE id = $1
        `;

        return await this.query(query, [entityId]);
    }

    async getAllGenres() {
        const query = 'SELECT name FROM genre ORDER BY name';
        const result = await this.query(query);
        return result.map(row => row.name);
    }
}

module.exports = MusicRepository;