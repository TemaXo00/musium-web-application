class ContentLoader {
    constructor() {
        this.buttons = document.querySelectorAll('.hero__menu-button');
        this.contentContainer = document.getElementById('content-container');
        this.loadingMessages = [
            "Loading fresh tracks...",
            "Discovering new albums...",
            "Updating collections...",
            "Preparing content...",
            "Loading music releases...",
            "Gathering best releases...",
            "Updating library...",
            "Finding trending songs..."
        ];
        this.subMessages = [
            "This will take just a few seconds",
            "Music is on its way",
            "Almost ready...",
            "Enjoy high-quality sound",
            "One moment, magic is happening"
        ];
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

    getRandomMessage() {
        return this.loadingMessages[Math.floor(Math.random() * this.loadingMessages.length)];
    }

    getRandomSubMessage() {
        return this.subMessages[Math.floor(Math.random() * this.subMessages.length)];
    }

    loadContent(page) {
        const randomMessage = this.getRandomMessage();
        const randomSubMessage = this.getRandomSubMessage();

        this.contentContainer.innerHTML = `
            <div class="loading">
                <div class="loading-content">
                    <div class="loading-message">${randomMessage}</div>
                    <div class="loading-submessage">${randomSubMessage}</div>
                </div>
            </div>
        `;

        const timestamp = new Date().getTime();
        fetch(`/content/${page}/?t=${timestamp}`)
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
                        <div class="error-message">Error loading content: ${error.message}</div>
                        <button class="error-button" onclick="location.reload()">Reload page</button>
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