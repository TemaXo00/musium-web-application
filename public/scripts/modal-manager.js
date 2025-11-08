class ModalManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindModalEvents();
    }

    bindModalEvents() {
        document.querySelectorAll('.modal-close, .author-modal-close, .settings-modal-close, .profile-modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = e.target.closest('.modal, .author-modal, .settings-modal, .profile-modal');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });

        document.querySelectorAll('.modal, .author-modal, .settings-modal, .profile-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        document.querySelectorAll('.modal-content, .author-modal-content, .settings-modal-content, .profile-modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    closeModal(modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    closeAllModals() {
        document.querySelectorAll('.modal, .author-modal, .settings-modal, .profile-modal').forEach(modal => {
            this.closeModal(modal);
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    showRejectModal(type, id) {
        document.getElementById('rejectType').value = type;
        document.getElementById('rejectId').value = id;
        document.getElementById('rejectReason').value = '';
        this.openModal('rejectModal');
    }

    showEntityModal() {
        document.getElementById('modal-title').textContent = 'Create New Entity';
        document.getElementById('entityForm').reset();
        document.getElementById('entityId').value = '';
        document.getElementById('tracksSection').style.display = 'none';
        document.getElementById('tracksContainer').innerHTML = '';
        this.openModal('entityModal');
    }

    showEditProfileModal() {
        this.openModal('editProfileModal');
    }

    showDeleteAccountModal() {
        this.openModal('deleteAccountModal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.modalManager = new ModalManager();

    window.openEditModal = function() {
        window.modalManager.showEditProfileModal();
    };

    window.closeEditModal = function() {
        window.modalManager.closeModal(document.getElementById('editProfileModal'));
    };

    window.openDeleteModal = function() {
        window.modalManager.showDeleteAccountModal();
    };

    window.closeDeleteModal = function() {
        window.modalManager.closeModal(document.getElementById('deleteAccountModal'));
    };
});