class NavigationHandler {
    constructor() {
        this.init();
    }

    init() {
        this.bindLogoNavigation();
        this.bindAuthButtons();
        this.bindMenuButtons();
    }

    bindLogoNavigation() {
        const logoSection = document.querySelector('.header__logo-section');
        const logoImage = document.querySelector('.header__logo-img');

        const navigateToHome = () => {
            window.location.href = '/';
        };

        if (logoSection) {
            logoSection.addEventListener('click', navigateToHome);
            logoSection.style.cursor = 'pointer';
        }
        if (logoImage) {
            logoImage.addEventListener('click', navigateToHome);
        }
    }

    bindAuthButtons() {
        const authButtons = document.querySelectorAll('.header__auth-button');
        authButtons.forEach(button => {
            button.addEventListener('click', () => {
                const href = button.getAttribute('data-href');
                if (href) {
                    window.location.href = href;
                }
            });
        });
    }

    bindMenuButtons() {
        const menuButtons = document.querySelectorAll('.header__menu-button');
        menuButtons.forEach(button => {
            if (!button.id || button.id !== 'logoutButton') {
                button.addEventListener('click', () => {
                    const href = button.getAttribute('data-href');
                    if (href) {
                        window.location.href = href;
                    }
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NavigationHandler();
});