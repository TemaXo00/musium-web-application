class AuthorPanel {
    constructor() {
        this.isSubmitting = false;
        this.currentTab = 'tracks';
        this.currentStatus = 'all';
        this.genres = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadGenres();
        this.loadEntities();
    }

    bindEvents() {
        document.querySelectorAll('.author-panel-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tab = e.currentTarget;
                this.currentTab = tab.getAttribute('data-tab');
                this.currentStatus = tab.getAttribute('data-status');

                document.querySelectorAll('.author-panel-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                this.loadEntities();
            });
        });

        const entityForm = document.getElementById('entityForm');
        if (entityForm) {
            entityForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const entityType = document.getElementById('entityType');
        if (entityType) {
            entityType.addEventListener('change', (e) => this.handleTypeChange(e.target.value));
        }
    }

    async loadGenres() {
        try {
            const response = await fetch('/author/genres');
            const data = await response.json();

            if (data.success) {
                this.genres = data.data;
                this.populateGenreSelect();
            }
        } catch (error) {
            console.error('Failed to load genres:', error);
        }
    }

    populateGenreSelect() {
        const genreSelect = document.getElementById('entityGenre');
        if (genreSelect && this.genres.length > 0) {
            genreSelect.innerHTML = '<option value="">Select genre</option>' +
                this.genres.map(genre =>
                    `<option value="${genre.id}">${this.escapeHtml(genre.name)}</option>`
                ).join('');
        }
    }

    async loadEntities() {
        const container = document.getElementById('entities-list');
        const countElement = document.getElementById('entities-count');

        if (!container) return;

        container.innerHTML = '<div class="author-panel-loading"><div class="author-panel-loading__message">Loading content...</div></div>';

        try {
            let url = '/author/entities?';
            if (this.currentTab !== 'pending' && this.currentTab !== 'approved' && this.currentTab !== 'removed') {
                url += `type=${this.getTypeFromTab(this.currentTab)}&`;
            }
            if (this.currentStatus !== 'all') {
                url += `status=${this.currentStatus}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                if (countElement) {
                    countElement.textContent = `(${data.data.length})`;
                }
                this.renderEntities(data.data);
            } else {
                container.innerHTML = '<div class="author-panel-empty"><div class="author-panel-empty__message">Error loading content</div></div>';
            }
        } catch (error) {
            container.innerHTML = '<div class="author-panel-empty"><div class="author-panel-empty__message">Failed to load content</div></div>';
        }
    }

    getTypeFromTab(tab) {
        const typeMap = {
            'tracks': 'Song',
            'albums': 'Album',
            'eps': 'EP'
        };
        return typeMap[tab] || 'all';
    }

    renderEntities(entities) {
        const container = document.getElementById('entities-list');
        if (!container) return;

        if (!entities || entities.length === 0) {
            container.innerHTML = `
                <div class="author-panel-empty">
                    <div class="author-panel-empty__message">No content found</div>
                    <div class="author-panel-empty__suggestion">Create your first entity to get started</div>
                </div>
            `;
            return;
        }

        container.innerHTML = entities.map(entity => this.createEntityHTML(entity)).join('');
    }

    createEntityHTML(entity) {
        const statusClass = `author-panel-item__status--${entity.status}`;
        const statusText = this.getStatusText(entity.status);
        const tracks = entity.track_count || entity.ep_track_count;

        return `
            <div class="author-panel-item" data-entity-id="${entity.id}">
                <div class="author-panel-item__header">
                    <div class="author-panel-item__info">
                        <h3 class="author-panel-item__title">${this.escapeHtml(entity.name)}</h3>
                        <div class="author-panel-item__meta">
                            <span class="author-panel-item__detail"><strong>Type:</strong> ${entity.type}</span>
                            <span class="author-panel-item__detail"><strong>Genre:</strong> ${entity.genre_name || 'N/A'}</span>
                            ${tracks ? `<span class="author-panel-item__detail"><strong>Tracks:</strong> ${tracks}</span>` : ''}
                            <span class="author-panel-item__detail"><strong>Views:</strong> ${entity.views}</span>
                            <span class="author-panel-item__detail"><strong>Created:</strong> ${new Date(entity.created_at).toLocaleDateString()}</span>
                        </div>
                        ${entity.description ? `<div class="author-panel-item__description">${this.escapeHtml(entity.description)}</div>` : ''}
                        ${entity.status === 'declined' && entity.reason ? `
                            <div class="author-panel-item__reason">
                                <span class="author-panel-item__reason-label">Reason for decline:</span>
                                <p class="author-panel-item__reason-text">${this.escapeHtml(entity.reason)}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="author-panel-item__actions">
                        <span class="author-panel-item__status ${statusClass}">${statusText}</span>
                        ${entity.status !== 'removed' && entity.status !== 'declined' ? `
                            <button class="author-panel-button author-panel-button--secondary" onclick="authorPanel.editEntity(${entity.id})">
                                Edit
                            </button>
                            <button class="author-panel-button author-panel-button--danger" onclick="authorPanel.deleteEntity(${entity.id})">
                                Delete
                            </button>
                        ` : ''}
                        ${entity.status === 'declined' ? `
                            <button class="author-panel-button author-panel-button--secondary" onclick="authorPanel.editEntity(${entity.id})">
                                Edit & Resubmit
                            </button>
                        ` : ''}
                        ${entity.status === 'removed' ? `
                            <button class="author-panel-button author-panel-button--primary" onclick="authorPanel.restoreEntity(${entity.id})">
                                Restore
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'PENDING',
            'approved': 'APPROVED',
            'declined': 'DECLINED',
            'removed': 'DELETED'
        };
        return statusMap[status] || status.toUpperCase();
    }

    showCreateModal() {
        window.modalManager.showEntityModal();
    }

    async editEntity(id) {
        try {
            const response = await fetch(`/author/entity/${id}`);
            const data = await response.json();

            if (data.success) {
                const { entity, tracks } = data.data;
                this.populateEditForm(entity, tracks);
            } else {
                alert('Error loading entity: ' + data.error);
            }
        } catch (error) {
            alert('Failed to load entity');
        }
    }

    populateEditForm(entity, tracks = []) {
        document.getElementById('modal-title').textContent = `Edit ${entity.type}`;
        document.getElementById('entityId').value = entity.id;
        document.getElementById('entityType').value = entity.type;
        document.getElementById('entityName').value = entity.name;
        document.getElementById('entityDescription').value = entity.description || '';
        document.getElementById('entityAvatar').value = entity.avatar_url;
        document.getElementById('entityUrl').value = entity.entity_url;
        document.getElementById('entityGenre').value = entity.genre_id;

        this.handleTypeChange(entity.type);

        if (tracks.length > 0) {
            const tracksContainer = document.getElementById('tracksContainer');
            tracksContainer.innerHTML = '';
            tracks.forEach((track, index) => {
                this.addTrack(track.name, track.url_link, index);
            });
        }

        window.modalManager.openModal('entityModal');
    }

    handleTypeChange(type) {
        const tracksSection = document.getElementById('tracksSection');
        const tracksContainer = document.getElementById('tracksContainer');

        if (type === 'Album' || type === 'EP') {
            tracksSection.style.display = 'block';
            if (tracksContainer.children.length === 0) {
                this.addTrack();
            }
        } else {
            tracksSection.style.display = 'none';
            tracksContainer.innerHTML = '';
        }
    }

    addTrack(name = '', url = '', index = null) {
        const tracksContainer = document.getElementById('tracksContainer');
        const trackIndex = index !== null ? index : tracksContainer.children.length;

        const trackHTML = `
            <div class="track-item">
                <span class="track-item__order">${trackIndex + 1}</span>
                <input type="text" class="track-item__input author-form-control" 
                       placeholder="Track name" value="${this.escapeHtml(name)}" 
                       data-track-name required>
                <input type="url" class="track-item__input author-form-control" 
                       placeholder="Track URL" value="${this.escapeHtml(url)}" 
                       data-track-url required>
                <button type="button" class="track-item__remove" onclick="authorPanel.removeTrack(this)">
                    ×
                </button>
            </div>
        `;

        if (index !== null) {
            const existingTrack = tracksContainer.children[index];
            if (existingTrack) {
                existingTrack.outerHTML = trackHTML;
            } else {
                tracksContainer.insertAdjacentHTML('beforeend', trackHTML);
            }
        } else {
            tracksContainer.insertAdjacentHTML('beforeend', trackHTML);
        }
    }

    removeTrack(button) {
        const trackItem = button.closest('.track-item');
        if (trackItem) {
            trackItem.remove();
            this.renumberTracks();
        }
    }

    renumberTracks() {
        const tracksContainer = document.getElementById('tracksContainer');
        const trackItems = tracksContainer.querySelectorAll('.track-item');
        trackItems.forEach((item, index) => {
            const orderSpan = item.querySelector('.track-item__order');
            if (orderSpan) {
                orderSpan.textContent = index + 1;
            }
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        if (this.isSubmitting) return;

        this.isSubmitting = true;
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;

        try {
            const formData = new FormData(e.target);
            const entityId = document.getElementById('entityId').value;

            const data = {
                type: formData.get('type'),
                name: formData.get('name'),
                description: formData.get('description'),
                avatar_url: formData.get('avatar_url'),
                entity_url: formData.get('entity_url'),
                genre_id: formData.get('genre_id')
            };

            if (data.type === 'Album' || data.type === 'EP') {
                const tracks = [];
                const trackItems = document.querySelectorAll('.track-item');
                trackItems.forEach(item => {
                    const name = item.querySelector('[data-track-name]').value;
                    const url = item.querySelector('[data-track-url]').value;
                    if (name && url) {
                        tracks.push({ name, url_link: url });
                    }
                });
                data.tracks = tracks;
            }

            const url = entityId ? `/author/entity/${entityId}` : '/author/entity';
            const method = entityId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                if (entityId) {
                    alert('Entity updated successfully! Changes will be reviewed by admin.');
                } else {
                    alert('Entity created successfully! It will be reviewed by admin.');
                }
                this.closeModal();
                this.loadEntities();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Failed to save entity');
        } finally {
            this.isSubmitting = false;
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    async deleteEntity(id) {
        if (!confirm('Are you sure you want to delete this entity? It will be marked as removed.')) {
            return;
        }

        try {
            const response = await fetch(`/author/entity/${id}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                alert('Entity deleted successfully!');
                this.loadEntities();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Failed to delete entity');
        }
    }

    async restoreEntity(id) {
        try {
            const response = await fetch(`/author/entity/${id}/restore`, { method: 'PATCH' });
            const data = await response.json();

            if (data.success) {
                alert('Entity restored successfully!');
                this.loadEntities();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Failed to restore entity');
        }
    }

    closeModal() {
        window.modalManager.closeModal(document.getElementById('entityModal'));
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
    window.authorPanel = new AuthorPanel();
});