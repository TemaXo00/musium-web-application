class ContentLoader {
    constructor() {
        this.buttons = document.querySelectorAll('.hero__menu-button');
        this.contentContainer = document.getElementById('content-container');
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadContent('new');
        this.setActiveButton(document.querySelector('[data-page="new"]'));
    }

    bindEvents() {
        this.buttons.forEach(button => {
            button.addEventListener('click', () => {
                const page = button.getAttribute('data-page');
                this.loadContent(page);
                this.setActiveButton(button);
            });
        });
    }

    setActiveButton(activeButton) {
        this.buttons.forEach(btn => {
            btn.classList.remove('active');
        });

        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    loadContent(page) {
        this.contentContainer.innerHTML = '<div class="loading">Loading...</div>';

        fetch(`/content/${page}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                this.contentContainer.innerHTML = html;
                this.initializeNewContent();
            })
            .catch(error => {
                this.contentContainer.innerHTML = `
                    <div class="error">
                        <p>Error loading content</p>
                        <button onclick="location.reload()">Update page</button>
                    </div>
                `;
            });
    }

    initializeNewContent() {
        const userMenuScripts = document.createElement('script');
        userMenuScripts.src = '/scripts/user-menu.js';
        document.head.appendChild(userMenuScripts);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ContentLoader();
});