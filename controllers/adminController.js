const BaseController = require('./baseController');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

class adminController extends BaseController {
    constructor(musicRepository, userRepository) {
        super();
        this.musicRepository = musicRepository;
        this.userRepository = userRepository;
        this.reportsDir = path.join(__dirname, '../reports');
        this.ensureReportsDirectory();
        this.initializeRoutes();
    }

    ensureReportsDirectory() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    initializeRoutes() {
        this.router.get('/', this.renderAdminPage.bind(this));
        this.router.get('/tracks', this.getTracks.bind(this));
        this.router.get('/albums', this.getAlbums.bind(this));
        this.router.get('/eps', this.getEPs.bind(this));
        this.router.get('/users', this.getUsers.bind(this));
        this.router.post('/approve/:type/:id', this.approveEntity.bind(this));
        this.router.post('/reject/:type/:id', this.rejectEntity.bind(this));
        this.router.post('/users/search', this.searchUsers.bind(this));
        this.router.delete('/users/delete/:id', this.deleteUser.bind(this));
        this.router.post('/reports/generate', this.generateReport.bind(this));
    }

    async renderAdminPage(req, res) {
        try {
            const genres = await this.musicRepository.getAllGenres();
            res.render('pages/admin', {
                title: 'Admin Panel',
                user: req.session.user || null,
                currentPage: 'admin',
                genres: genres || []
            });
        } catch (error) {
            this.handleError(res, error, 'Failed to load admin panel');
        }
    }

    async generateReport(req, res) {
        try {
            const { reportType, format, startDate, endDate, genre, status } = req.body;

            let reportData;
            let filename;

            switch (reportType) {
                case 'content-statistics':
                    reportData = await this.generateContentStatisticsReport(startDate, endDate, genre, status);
                    filename = `content_statistics_${new Date().toISOString().split('T')[0]}`;
                    break;

                case 'user-activity':
                    reportData = await this.generateUserActivityReport(startDate, endDate);
                    filename = `user_activity_${new Date().toISOString().split('T')[0]}`;
                    break;

                case 'approval-stats':
                    reportData = await this.generateApprovalStatisticsReport(startDate, endDate);
                    filename = `approval_statistics_${new Date().toISOString().split('T')[0]}`;
                    break;

                default:
                    throw new Error('Invalid report type');
            }

            let filePath;
            if (format === 'csv') {
                filePath = await this.saveAsCSV(reportData, filename);
            } else if (format === 'json') {
                filePath = await this.saveAsJSON(reportData, filename);
            } else {
                throw new Error('Invalid format');
            }

            res.download(filePath, path.basename(filePath), (err) => {
                if (err) {
                    console.error('Download error:', err);
                }
            });

        } catch (error) {
            this.sendError(res, 'Failed to generate report: ' + error.message);
        }
    }

    async generateContentStatisticsReport(startDate, endDate, genre, status) {
        let conditions = [];
        let params = [];
        let paramCount = 1;

        if (startDate) {
            conditions.push(`me.created_at >= $${paramCount}`);
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            conditions.push(`me.created_at <= $${paramCount}`);
            params.push(endDate + ' 23:59:59');
            paramCount++;
        }

        if (genre && genre !== 'all') {
            conditions.push(`g.name = $${paramCount}`);
            params.push(genre);
            paramCount++;
        }

        if (status && status !== 'all') {
            conditions.push(`me.status = $${paramCount}`);
            params.push(status);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT
                me.type,
                me.status,
                COUNT(*) as count,
                SUM(me.views) as total_views,
                g.name as genre_name,
                DATE(me.created_at) as date,
                AVG(me.views) as avg_views
            FROM music_entity me
                     LEFT JOIN genre g ON me.genre_id = g.id
                ${whereClause}
            GROUP BY me.type, me.status, g.name, DATE(me.created_at)
            ORDER BY date DESC, me.type
        `;

        return await this.musicRepository.query(query, params);
    }

    async generateUserActivityReport(startDate, endDate) {
        let conditions = [];
        let params = [];
        let paramCount = 1;

        if (startDate) {
            conditions.push(`u.created_at >= $${paramCount}`);
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            conditions.push(`u.created_at <= $${paramCount}`);
            params.push(endDate + ' 23:59:59');
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT
                u.type,
                COUNT(*) as user_count,
                DATE(u.created_at) as registration_date,
                COUNT(me.id) as content_count,
                SUM(me.views) as total_user_views
            FROM users u
                     LEFT JOIN music_entity me ON u.id = me.author_id
                ${whereClause}
            GROUP BY u.type, DATE(u.created_at)
            ORDER BY registration_date DESC
        `;

        return await this.userRepository.query(query, params);
    }

    async generateApprovalStatisticsReport(startDate, endDate) {
        let conditions = [];
        let params = [];
        let paramCount = 1;

        if (startDate) {
            conditions.push(`me.created_at >= $${paramCount}`);
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            conditions.push(`me.created_at <= $${paramCount}`);
            params.push(endDate + ' 23:59:59');
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT
                me.status,
                me.type,
                COUNT(*) as count,
                DATE(me.created_at) as submission_date,
                DATE(me.updated_at) as decision_date,
                u.nickname as author_name,
                AVG(DATE_PART('day', me.updated_at - me.created_at)) as avg_decision_days
            FROM music_entity me
                     LEFT JOIN users u ON me.author_id = u.id
                ${whereClause}
            GROUP BY me.status, me.type, DATE(me.created_at), DATE(me.updated_at), u.nickname
            ORDER BY submission_date DESC
        `;

        return await this.musicRepository.query(query, params);
    }

    async saveAsCSV(data, filename) {
        if (!data || data.length === 0) {
            throw new Error('No data to export');
        }

        const csvWriter = createObjectCsvWriter({
            path: path.join(this.reportsDir, `${filename}.csv`),
            header: Object.keys(data[0]).map(key => ({ id: key, title: key }))
        });

        await csvWriter.writeRecords(data);
        return path.join(this.reportsDir, `${filename}.csv`);
    }

    async saveAsJSON(data, filename) {
        const filePath = path.join(this.reportsDir, `${filename}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return filePath;
    }

    async getTracks(req, res) {
        try {
            const tracks = await this.musicRepository.getPendingTracks();
            this.sendSuccess(res, tracks);
        } catch (error) {
            this.sendError(res, 'Failed to get tracks');
        }
    }

    async getAlbums(req, res) {
        try {
            const albums = await this.musicRepository.getPendingAlbums();
            this.sendSuccess(res, albums);
        } catch (error) {
            this.sendError(res, 'Failed to get albums');
        }
    }

    async getEPs(req, res) {
        try {
            const eps = await this.musicRepository.getPendingEPs();
            this.sendSuccess(res, eps);
        } catch (error) {
            this.sendError(res, 'Failed to get EPs');
        }
    }

    async getUsers(req, res) {
        try {
            const users = await this.userRepository.getAllUsers();
            this.sendSuccess(res, users);
        } catch (error) {
            this.sendError(res, 'Failed to get users');
        }
    }

    async searchUsers(req, res) {
        try {
            const { nickname } = req.body;
            const users = await this.userRepository.searchByNickname(nickname);
            this.sendSuccess(res, users);
        } catch (error) {
            this.sendError(res, 'Failed to search users');
        }
    }

    async approveEntity(req, res) {
        try {
            const { type, id } = req.params;
            const result = await this.processEntityApproval(type, id);

            if (result && result.length > 0) {
                this.sendSuccess(res, null, `${type} approved successfully`);
            } else {
                this.sendNotFound(res, `${type} not found`);
            }
        } catch (error) {
            this.sendError(res, 'Failed to approve entity');
        }
    }

    async rejectEntity(req, res) {
        try {
            const { type, id } = req.params;
            const { reason } = req.body;
            const result = await this.processEntityRejection(type, id, reason);

            if (result && result.length > 0) {
                this.sendSuccess(res, null, `${type} rejected successfully`);
            } else {
                this.sendNotFound(res, `${type} not found`);
            }
        } catch (error) {
            this.sendError(res, 'Failed to reject entity: ' + error.message);
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            await this.userRepository.deleteUser(id);
            this.sendSuccess(res, null, 'User deleted successfully');
        } catch (error) {
            this.sendError(res, 'Failed to delete user');
        }
    }

    processEntityApproval(type, id) {
        return this.musicRepository.approveEntity(type, id);
    }

    processEntityRejection(type, id, reason) {
        return this.musicRepository.rejectEntity(type, id, reason);
    }
}

module.exports = adminController;