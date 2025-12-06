class AdminContentManager extends AdminBase {
    constructor() {
        super();
        this.endpoints = {
            'tracks': '/admin/tracks',
            'albums': '/admin/albums',
            'eps': '/admin/eps',
            'users': '/admin/users'
        };
    }

    renderContent(tabName, items, container) {
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = this.getNoDataHTML();
            return;
        }

        const renderMethod = tabName === 'users' ? 'createUserItemHTML' : 'createEntityItemHTML';
        container.innerHTML = items.map(item => this[renderMethod](tabName, item)).join('');
    }

    getNoDataHTML() {
        return `
            <div class="admin-no-data">
                <div class="admin-no-data__message">No items found</div>
                <div class="admin-no-data__suggestion">Check back later for new submissions</div>
            </div>
        `;
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

    async loadContent(tabName) {
        const container = document.getElementById(`${tabName}-list`);
        const countElement = document.getElementById(`${tabName}-count`);

        if (!container) return;

        this.showLoading(container);

        const data = await this.fetchData(`${this.endpoints[tabName]}?t=${Date.now()}`);

        if (data.success) {
            if (countElement) {
                countElement.textContent = `(${data.data.length})`;
            }
            this.renderContent(tabName, data.data, container);
        } else {
            this.showError(container, `Error: ${data.error}`);
        }
    }

    async approveEntity(type, id) {
        if (this.isSubmitting) return;
        if (!confirm(`Approve this ${type}?`)) return;

        this.isSubmitting = true;
        try {
            const endpoint = `/admin/approve/${type.toLowerCase()}/${id}`;
            const data = await this.fetchData(endpoint, { method: 'POST' });

            if (data.success) {
                alert('Approved successfully!');
                return true;
            } else {
                alert('Error: ' + data.error);
                return false;
            }
        } catch (error) {
            alert('Error: ' + error.message);
            return false;
        } finally {
            this.isSubmitting = false;
        }
    }

    async deleteUser(userId) {
        if (!confirm('Delete this user?')) return;

        try {
            const data = await this.fetchData(`/admin/users/delete/${userId}`, { method: 'DELETE' });

            if (data.success) {
                alert('User deleted!');
                return true;
            } else {
                alert('Error: ' + data.error);
                return false;
            }
        } catch (error) {
            alert('Error: ' + error.message);
            return false;
        }
    }

    async searchUsers(searchTerm) {
        const container = document.getElementById('users-list');
        if (!container) return;

        this.showLoading(container, 'Searching...');

        const data = await this.fetchData('/admin/users/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: searchTerm })
        });

        if (data.success) {
            this.renderContent('users', data.data, container);
        } else {
            this.showError(container, 'Search failed');
        }
    }
}