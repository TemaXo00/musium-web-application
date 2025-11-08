class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindForms();
    }

    bindForms() {
        const nicknameForm = document.getElementById('nicknameForm');
        if (nicknameForm) {
            nicknameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateNickname();
            });
        }

        const emailForm = document.getElementById('emailForm');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateEmail();
            });
        }

        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePassword();
            });
        }

        const deleteAccountForm = document.getElementById('deleteAccountForm');
        if (deleteAccountForm) {
            deleteAccountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.deleteAccount();
            });
        }
    }

    async updateNickname() {
        const nicknameInput = document.getElementById('nicknameInput');
        const nicknameError = document.getElementById('nicknameError');
        const button = document.querySelector('#nicknameForm button');

        const nickname = nicknameInput.value.trim();

        if (nickname.length < 3) {
            this.showError(nicknameError, 'Nickname must be at least 3 characters long');
            return;
        }

        this.hideError(nicknameError);

        button.disabled = true;
        button.textContent = 'Updating...';

        try {
            const response = await fetch('/settings/update-nickname', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nickname })
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('currentNickname').textContent = nickname;
                document.querySelector('.settings-profile-avatar__name').textContent = nickname;
                this.showSuccess('Nickname updated successfully!');
                nicknameInput.value = nickname;
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                this.showError(nicknameError, data.error);
            }
        } catch (error) {
            this.showError(nicknameError, 'Failed to update nickname');
        } finally {
            button.disabled = false;
            button.textContent = 'Update Nickname';
        }
    }

    async updateEmail() {
        const emailInput = document.getElementById('emailInput');
        const emailError = document.getElementById('emailError');
        const button = document.querySelector('#emailForm button');

        const email = emailInput.value.trim();

        if (!email.includes('@')) {
            this.showError(emailError, 'Please enter a valid email address');
            return;
        }

        this.hideError(emailError);

        button.disabled = true;
        button.textContent = 'Updating...';

        try {
            const response = await fetch('/settings/update-email', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('currentEmail').textContent = email;
                this.showSuccess('Email updated successfully!');
                emailInput.value = email;
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                this.showError(emailError, data.error);
            }
        } catch (error) {
            this.showError(emailError, 'Failed to update email');
        } finally {
            button.disabled = false;
            button.textContent = 'Update Email';
        }
    }

    async updatePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const passwordError = document.getElementById('passwordError');
        const button = document.querySelector('#passwordForm button');

        if (!currentPassword) {
            this.showError(passwordError, 'Current password is required');
            return;
        }

        if (newPassword.length < 6) {
            this.showError(passwordError, 'New password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError(passwordError, 'New passwords do not match');
            return;
        }

        this.hideError(passwordError);

        button.disabled = true;
        button.textContent = 'Updating...';

        try {
            const response = await fetch('/settings/update-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Password updated successfully!');
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                this.showError(passwordError, data.error);
            }
        } catch (error) {
            this.showError(passwordError, 'Failed to update password');
        } finally {
            button.disabled = false;
            button.textContent = 'Update Password';
        }
    }

    async deleteAccount() {
        const confirmationText = document.getElementById('confirmationText').value.trim();
        const confirmNickname = document.getElementById('confirmNickname').value.trim();
        const confirmationError = document.getElementById('confirmationError');
        const nicknameConfirmError = document.getElementById('nicknameConfirmError');
        const button = document.querySelector('#deleteAccountForm button');

        let hasError = false;

        if (confirmationText !== 'yes, i know what i am doing') {
            this.showError(confirmationError, 'Confirmation text is incorrect');
            hasError = true;
        } else {
            this.hideError(confirmationError);
        }

        if (confirmNickname !== document.querySelector('.settings-profile-avatar__name').textContent) {
            this.showError(nicknameConfirmError, 'Nickname does not match');
            hasError = true;
        } else {
            this.hideError(nicknameConfirmError);
        }

        if (hasError) return;

        button.disabled = true;
        button.textContent = 'Deleting...';

        try {
            const response = await fetch('/auth/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Account deleted successfully! Redirecting to home page...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                this.showError(confirmationError, data.error);
            }
        } catch (error) {
            this.showError(confirmationError, 'Failed to delete account: ' + error.message);
        } finally {
            button.disabled = false;
            button.textContent = 'Delete Account Permanently';
        }
    }

    openDeleteModal() {
        window.modalManager.showDeleteAccountModal();
    }

    closeDeleteModal() {
        window.modalManager.closeModal(document.getElementById('deleteAccountModal'));
    }

    showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    hideError(element) {
        element.textContent = '';
        element.style.display = 'none';
    }

    showSuccess(message) {
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});