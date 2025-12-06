class AdminBase {
    constructor() {
        this.isSubmitting = false;
        this.eventBound = false;
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

    showLoading(element, message = 'Loading...') {
        if (element) {
            element.innerHTML = `<div class="admin-loading">${message}</div>`;
        }
    }

    showError(element, message) {
        if (element) {
            element.innerHTML = `<div class="admin-error">${message}</div>`;
        }
    }

    async fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}