class SearchHandler {
    constructor() {
        this.init();
    }

    init() {
        this.bindSearchForm();
        this.bindFilterRemoval();
    }

    bindSearchForm() {
        const searchForm = document.querySelector('.main-search__form');
        const searchInput = document.querySelector('.main-search__input');
        const searchButton = document.querySelector('.main-search__button');

        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch(searchInput, searchButton);
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchForm.dispatchEvent(new Event('submit'));
                }
            });

            searchInput.addEventListener('focus', () => {
                searchInput.parentElement.classList.add('focused');
            });

            searchInput.addEventListener('blur', () => {
                searchInput.parentElement.classList.remove('focused');
            });

            searchInput.value = '';
        }
    }

    bindFilterRemoval() {
        const removeButtons = document.querySelectorAll('.active-filter__remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const filterType = button.getAttribute('data-filter');
                this.removeFilter(filterType);
            });
        });
    }

    handleSearch(searchInput, searchButton) {
        const query = searchInput.value.trim();

        if (query) {
            searchButton.style.opacity = '0.7';
            searchButton.disabled = true;
            window.location.href = `/content/search?q=${encodeURIComponent(query)}`;
        }
    }

    removeFilter(filterType) {
        const url = new URL(window.location.href);
        const searchParams = new URLSearchParams(url.search);

        if (filterType === 'type') {
            searchParams.set('type', 'all');
        } else if (filterType === 'genre') {
            searchParams.set('genre', 'all');
        } else if (filterType === 'sort') {
            searchParams.set('sort', 'relevance');
        }

        url.search = searchParams.toString();
        window.location.href = url.toString();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SearchHandler();
});