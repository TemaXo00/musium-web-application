class UserMenu {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const userAvatar = document.getElementById('userAvatar');
        const profileMenu = document.getElementById('profileMenu');

        if (userAvatar && profileMenu) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                profileMenu.classList.remove('active');
            });

            profileMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        }

        document.querySelectorAll('[data-href]').forEach(button => {
            if (button.id !== 'logoutButton') {
                button.addEventListener('click', function() {
                    const href = this.getAttribute('data-href');
                    if (href) {
                        window.location.href = href;
                    }
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && profileMenu?.classList.contains('active')) {
                profileMenu.classList.remove('active');
            }
        });
    }

    async handleLogout() {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = '/';
            } else {
                alert('Logout failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Logout failed. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UserMenu();
});