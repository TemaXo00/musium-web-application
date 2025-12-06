class AdminPanel extends AdminBase {
    constructor() {
        super();
        this.currentTab = 'tracks';
        this.reportsModule = new AdminReports();
        this.contentManager = new AdminContentManager();
        this.init();
    }

    init() {
        if (this.eventBound) return;
        this.eventBound = true;

        this.bindEvents();
        this.switchTab('tracks');
    }

    bindEvents() {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);

                if (tabName === 'reports') {
                    this.reportsModule.init();
                }
            });
        });

        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchUsers());
        }

        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchUsers();
            });
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        const activeContent = document.getElementById(`${tabName}-tab`);
        activeContent.classList.add('active');
        activeContent.style.display = 'block';

        if (tabName !== 'reports') {
            this.loadTabContent(tabName);
        }
    }

    async loadTabContent(tabName) {
        return this.contentManager.loadContent(tabName);
    }

    async approveEntity(type, id) {
        const success = await this.contentManager.approveEntity(type, id);
        if (success) {
            this.loadTabContent(this.currentTab);
        }
    }

    showRejectModal(type, id) {
        window.modalManager.showRejectModal(type, id);
    }

    async submitRejection() {
        if (this.isSubmitting) return;

        const type = document.getElementById('rejectType').value;
        const id = document.getElementById('rejectId').value;
        const reason = document.getElementById('rejectReason').value || 'Rejected by admin';

        this.isSubmitting = true;
        try {
            const data = await this.fetchData(`/admin/reject/${type.toLowerCase()}/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            if (data.success) {
                alert('Rejected successfully!');
                window.modalManager.closeModal(document.getElementById('rejectModal'));
                this.loadTabContent(this.currentTab);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            this.isSubmitting = false;
        }
    }

    async deleteUser(userId) {
        const success = await this.contentManager.deleteUser(userId);
        if (success) {
            this.loadTabContent('users');
        }
    }

    async searchUsers() {
        const searchTerm = document.getElementById('user-search').value.trim();
        return this.contentManager.searchUsers(searchTerm);
    }

    selectReportType(reportType) {
        this.reportsModule.selectReportType(reportType);
    }

    cancelReport() {
        this.reportsModule.cancelReport();
    }

    generateReport() {
        this.reportsModule.generateReport();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();

    const rejectForm = document.getElementById('rejectForm');
    if (rejectForm) {
        rejectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.adminPanel.submitRejection();
        });
    }
});