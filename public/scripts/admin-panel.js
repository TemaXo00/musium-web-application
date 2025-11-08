class AdminPanel {
    constructor() {
        this.isSubmitting = false;
        this.eventBound = false;
        this.currentTab = 'tracks';
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

        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        const container = document.getElementById(`${tabName}-list`);
        const countElement = document.getElementById(`${tabName}-count`);

        if (!container) return;

        container.innerHTML = '<div class="admin-loading">Loading...</div>';

        try {
            const endpoints = {
                'tracks': '/admin/tracks',
                'albums': '/admin/albums',
                'eps': '/admin/eps',
                'users': '/admin/users'
            };

            const response = await fetch(endpoints[tabName] + '?t=' + Date.now());
            const data = await response.json();

            if (data.success) {
                if (countElement) {
                    countElement.textContent = `(${data.data.length})`;
                }
                this.renderContent(tabName, data.data);
            } else {
                container.innerHTML = `<div class="admin-error">Error: ${data.error}</div>`;
            }
        } catch (error) {
            container.innerHTML = `<div class="admin-error">Failed to load data</div>`;
        }
    }

    renderContent(tabName, items) {
        const container = document.getElementById(`${tabName}-list`);
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="admin-no-data">
                    <div class="admin-no-data__message">No items found</div>
                    <div class="admin-no-data__suggestion">Check back later for new submissions</div>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => this.createItemHTML(tabName, item)).join('');
    }

    createItemHTML(tabName, item) {
        if (tabName === 'users') {
            return this.createUserItemHTML(item);
        } else {
            return this.createEntityItemHTML(tabName, item);
        }
    }

    createEntityItemHTML(tabName, item) {
        const typeMap = {
            'tracks': 'Song',
            'albums': 'Album',
            'eps': 'EP'
        };
        const entityType = typeMap[tabName];
        const defaultAvatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_GrWvA5oKbxeiALyR8O5xG6zkVxgFVFQpQw&s';
        const avatarUrl = item.avatar_url || defaultAvatar;

        return `
            <div class="admin-item">
                <div class="admin-item__left">
                    <img src="${avatarUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                    <div class="admin-item__name">
                        <h3>${this.escapeHtml(item.name)}</h3>
                        <div class="admin-item__details">
                            ${item.author_name ? `<span>Author: ${this.escapeHtml(item.author_name)}</span>` : ''}
                            ${item.genre_name ? `<span>Genre: ${this.escapeHtml(item.genre_name)}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="admin-item__right">
                    <button class="admin-item__button admin-item__button--unaccent" 
                            onclick="adminPanel.showRejectModal('${entityType}', ${item.id})">
                        Reject
                    </button>
                    <button class="admin-item__button admin-item__button--accent" 
                            onclick="adminPanel.approveEntity('${entityType}', ${item.id})">
                        Approve
                    </button>
                </div>
            </div>
        `;
    }

    createUserItemHTML(user) {
        const defaultAvatar = 'https://acdn-us.mitiendanube.com/stores/001/490/877/themes/common/ogimage-283891563-1753388753-4aa1e502ec80cea2e4264ee31a83af0f1753388753.png?0';
        const avatarUrl = user.avatar_url || defaultAvatar;
        const description = user.description || 'No description provided';

        return `
            <div class="admin-item">
                <div class="admin-item__left">
                    <div class="admin-item__image">
                        <img src="${avatarUrl}" alt="${user.nickname}" 
                             onerror="this.src='${defaultAvatar}'; this.classList.add('default-avatar')"
                             style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="admin-item__info">
                        <div class="admin-item__header">
                            <h3 class="admin-item__name">${this.escapeHtml(user.nickname)}</h3>
                            <span class="admin-item__type">${user.type}</span>
                        </div>
                        <div class="admin-item__details">
                            <span><strong>Email:</strong> ${this.escapeHtml(user.email)}</span>
                            <span><strong>Joined:</strong> ${new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="admin-item__description">
                            ${this.escapeHtml(description)}
                        </div>
                    </div>
                </div>
                <div class="admin-item__right">
                    <div class="admin-item__buttons">
                        <button class="admin-item__button admin-item__button--accent" 
                                onclick="adminPanel.deleteUser(${user.id})">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async approveEntity(type, id) {
        if (this.isSubmitting) return;
        if (!confirm(`Approve this ${type}?`)) return;

        this.isSubmitting = true;
        try {
            const endpoint = `/admin/approve/${type.toLowerCase()}/${id}`;

            const response = await fetch(endpoint, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                alert('Approved successfully!');
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
            const endpoint = `/admin/reject/${type.toLowerCase()}/${id}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            const data = await response.json();

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
        if (!confirm('Delete this user?')) return;

        try {
            const response = await fetch(`/admin/users/delete/${userId}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                alert('User deleted!');
                this.loadTabContent('users');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async searchUsers() {
        const searchTerm = document.getElementById('user-search').value.trim();
        const container = document.getElementById('users-list');

        if (!container) return;

        container.innerHTML = '<div class="admin-loading">Searching...</div>';

        try {
            const response = await fetch('/admin/users/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: searchTerm })
            });
            const data = await response.json();

            if (data.success) {
                this.renderContent('users', data.data);
            } else {
                container.innerHTML = `<div class="admin-error">Search failed</div>`;
            }
        } catch (error) {
            container.innerHTML = `<div class="admin-error">Search error</div>`;
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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