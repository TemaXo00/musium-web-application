class ProfileManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const editForm = document.getElementById('editProfileForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
            }
        });

        window.onclick = (e) => {
            const modal = document.getElementById('editProfileModal');
            if (e.target === modal) {
                this.closeEditModal();
            }
        };
    }

    openEditModal() {
        window.modalManager.showEditProfileModal();
    }

    closeEditModal() {
        window.modalManager.closeModal(document.getElementById('editProfileModal'));
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch('/profile/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                location.reload();
            } else {
                alert('Failed to update profile: ' + result.error);
            }
        } catch (error) {
            alert('An error occurred while updating the profile');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});