const BaseRepository = require('./baseRepository');

class AuthorRepository extends BaseRepository {
    constructor() {
        super();
    }

    async createMusicEntity(musicEntityData) {
        const query = `
            INSERT INTO music_entity (type, name, description, avatar_url, entity_url, genre_id, author_id, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
            RETURNING *
        `;
        const values = [
            musicEntityData.type,
            musicEntityData.name,
            musicEntityData.description,
            musicEntityData.avatar_url,
            musicEntityData.entity_url,
            musicEntityData.genre_id,
            musicEntityData.author_id
        ];
        const result = await this.query(query, values);
        return result[0];
    }

    async createMusicEntityWithDetails(entityData) {
        const musicEntity = await this.createMusicEntity(entityData);

        let specificEntity;
        const tracks = entityData.tracks || [];

        switch (entityData.type) {
            case 'Song':
                specificEntity = await this.createSong(musicEntity.id);
                break;
            case 'Album':
                specificEntity = await this.createAlbum(musicEntity.id);
                await this.addAlbumTracks(specificEntity.id, tracks);
                break;
            case 'EP':
                specificEntity = await this.createEP(musicEntity.id);
                await this.addEPTracks(specificEntity.id, tracks);
                break;
        }

        return { musicEntity, specificEntity };
    }

    async createSong(musicEntityId) {
        const query = `
            INSERT INTO song (music_entity_id)
            VALUES ($1)
            RETURNING *
        `;
        const result = await this.query(query, [musicEntityId]);
        return result[0];
    }

    async createAlbum(musicEntityId) {
        const query = `
            INSERT INTO album (music_entity_id)
            VALUES ($1)
            RETURNING *
        `;
        const result = await this.query(query, [musicEntityId]);
        return result[0];
    }

    async createEP(musicEntityId) {
        const query = `
            INSERT INTO ep (music_entity_id)
            VALUES ($1)
            RETURNING *
        `;
        const result = await this.query(query, [musicEntityId]);
        return result[0];
    }

    async addAlbumTracks(albumId, tracks) {
        for (let i = 0; i < tracks.length; i++) {
            await this.addAlbumTrack(albumId, tracks[i].name, tracks[i].url_link, i + 1);
        }
    }

    async addEPTracks(epId, tracks) {
        for (let i = 0; i < tracks.length; i++) {
            await this.addEPTrack(epId, tracks[i].name, tracks[i].url_link, i + 1);
        }
    }

    async addAlbumTrack(albumId, name, url_link, track_order) {
        const query = `
            INSERT INTO album_tracks (album_id, name, url_link, track_order)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await this.query(query, [albumId, name, url_link, track_order]);
        return result[0];
    }

    async addEPTrack(epId, name, url_link, track_order) {
        const query = `
            INSERT INTO ep_tracks (ep_id, name, url_link, track_order)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await this.query(query, [epId, name, url_link, track_order]);
        return result[0];
    }

    async getAuthorEntities(authorId, type = null, status = null) {
        const conditions = ['me.author_id = $1'];
        const params = [authorId];
        let paramCount = 1;

        if (type && type !== 'all') {
            paramCount++;
            conditions.push(`me.type = $${paramCount}`);
            params.push(type);
        }

        if (status && status !== 'all') {
            paramCount++;
            conditions.push(`me.status = $${paramCount}`);
            params.push(status);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                me.*,
                g.name as genre_name,
                u.nickname as author_name,
                (SELECT COUNT(*) FROM album_tracks WHERE album_id = a.id) as track_count,
                (SELECT COUNT(*) FROM ep_tracks WHERE ep_id = e.id) as ep_track_count
            FROM music_entity me
            LEFT JOIN genre g ON me.genre_id = g.id
            LEFT JOIN users u ON me.author_id = u.id
            LEFT JOIN album a ON me.id = a.music_entity_id AND me.type = 'Album'
            LEFT JOIN ep e ON me.id = e.music_entity_id AND me.type = 'EP'
            ${whereClause}
            ORDER BY me.created_at DESC
        `;

        return await this.query(query, params);
    }

    async updateMusicEntityWithTracks(id, updateData) {
        const { name, description, avatar_url, entity_url, genre_id, tracks } = updateData;

        const updatedEntity = await this.query(`
            UPDATE music_entity 
            SET name = $1, description = $2, avatar_url = $3, entity_url = $4, 
                genre_id = $5, updated_at = NOW(), status = 'pending'
            WHERE id = $6
            RETURNING *
        `, [name, description, avatar_url, entity_url, parseInt(genre_id), id]);

        const entity = await this.getEntityById(id);

        if (entity.type === 'Album' && tracks) {
            await this.deleteAlbumTracks(entity.album_id);
            await this.addAlbumTracks(entity.album_id, tracks);
        } else if (entity.type === 'EP' && tracks) {
            await this.deleteEPTracks(entity.ep_id);
            await this.addEPTracks(entity.ep_id, tracks);
        }

        return updatedEntity[0];
    }

    async softDeleteEntity(id) {
        const query = `
            UPDATE music_entity 
            SET status = 'removed', updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await this.query(query, [id]);
        return result[0];
    }

    async restoreEntity(id) {
        const query = `
            UPDATE music_entity 
            SET status = 'pending', updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await this.query(query, [id]);
        return result[0];
    }

    async getEntityById(id) {
        const query = `
            SELECT 
                me.*,
                g.name as genre_name,
                u.nickname as author_name,
                a.id as album_id,
                e.id as ep_id,
                s.id as song_id
            FROM music_entity me
            LEFT JOIN genre g ON me.genre_id = g.id
            LEFT JOIN users u ON me.author_id = u.id
            LEFT JOIN album a ON me.id = a.music_entity_id
            LEFT JOIN ep e ON me.id = e.music_entity_id
            LEFT JOIN song s ON me.id = s.music_entity_id
            WHERE me.id = $1
        `;
        const result = await this.query(query, [id]);
        return result[0];
    }

    async getEntityWithTracks(id) {
        const entity = await this.getEntityById(id);
        let tracks = [];

        if (entity.type === 'Album') {
            tracks = await this.getAlbumTracks(entity.album_id);
        } else if (entity.type === 'EP') {
            tracks = await this.getEPTracks(entity.ep_id);
        }

        return { entity, tracks };
    }

    async getAlbumTracks(albumId) {
        return await this.query(`
            SELECT * FROM album_tracks
            WHERE album_id = $1
            ORDER BY track_order
        `, [albumId]);
    }

    async getEPTracks(epId) {
        return await this.query(`
            SELECT * FROM ep_tracks
            WHERE ep_id = $1
            ORDER BY track_order
        `, [epId]);
    }

    async getAllGenres() {
        return await this.query('SELECT id, name FROM genre ORDER BY name');
    }

    async deleteAlbumTracks(albumId) {
        return await this.query('DELETE FROM album_tracks WHERE album_id = $1', [albumId]);
    }

    async deleteEPTracks(epId) {
        return await this.query('DELETE FROM ep_tracks WHERE ep_id = $1', [epId]);
    }
}

module.exports = AuthorRepository;