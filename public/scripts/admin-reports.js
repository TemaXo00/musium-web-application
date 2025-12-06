class AdminReports extends AdminBase {
    constructor() {
        super();
        this.isGenerating = false;
        this.currentReportType = null;
    }

    init() {
        this.bindEvents();
        this.setupDateLimits();
    }

    bindEvents() {
        document.querySelectorAll('.report-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const reportType = e.currentTarget.getAttribute('data-report');
                this.selectReportType(reportType);
            });
        });

        const reportForm = document.getElementById('report-form');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateReport();
            });
        }
    }

    setupDateLimits() {
        const startDate = document.getElementById('report-start-date');
        const endDate = document.getElementById('report-end-date');
        if (startDate && endDate) {
            const today = new Date().toISOString().split('T')[0];
            startDate.max = today;
            endDate.max = today;
            startDate.value = this.getDefaultStartDate();
            endDate.value = today;

            startDate.addEventListener('change', () => {
                if (startDate.value > endDate.value) {
                    endDate.value = startDate.value;
                }
                endDate.min = startDate.value;
            });

            endDate.addEventListener('change', () => {
                if (endDate.value < startDate.value) {
                    startDate.value = endDate.value;
                }
            });
        }
    }

    getDefaultStartDate() {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    }

    selectReportType(reportType) {
        this.currentReportType = reportType;

        document.querySelectorAll('.report-option').forEach(option => {
            option.classList.remove('selected');
        });

        document.querySelector(`[data-report="${reportType}"]`).classList.add('selected');
        document.getElementById('report-type').value = reportType;

        const filtersSection = document.getElementById('report-filters');
        filtersSection.classList.remove('hidden');

        const genreRow = document.getElementById('genre-filter-row');
        if (reportType === 'content-statistics') {
            genreRow.classList.remove('hidden');
        } else {
            genreRow.classList.add('hidden');
        }

        this.scrollToFilters();
    }

    scrollToFilters() {
        const filtersSection = document.getElementById('report-filters');
        if (filtersSection) {
            filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    cancelReport() {
        this.currentReportType = null;

        document.querySelectorAll('.report-option').forEach(option => {
            option.classList.remove('selected');
        });

        document.getElementById('report-filters').classList.add('hidden');
        document.getElementById('report-status-section').classList.add('hidden');
        document.getElementById('report-error').classList.add('hidden');
        document.getElementById('report-loading').classList.add('hidden');
    }

    async generateReport() {
        if (this.isGenerating) return;

        const form = document.getElementById('report-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (!data.startDate || !data.endDate) {
            this.showReportError('Please select both start and end dates');
            return;
        }

        if (new Date(data.startDate) > new Date(data.endDate)) {
            this.showReportError('Start date cannot be after end date');
            return;
        }

        this.isGenerating = true;
        this.showLoading();

        try {
            const response = await fetch('/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${data.reportType}_${new Date().toISOString().split('T')[0]}.${data.format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.hideStatus();
                alert('Report generated successfully!');
            } else {
                const errorData = await response.json();
                this.showReportError(errorData.error || 'Failed to generate report');
            }
        } catch (error) {
            this.showReportError('Network error: ' + error.message);
        } finally {
            this.isGenerating = false;
        }
    }

    showLoading() {
        document.getElementById('report-status-section').classList.remove('hidden');
        document.getElementById('report-loading').classList.remove('hidden');
        document.getElementById('report-error').classList.add('hidden');
    }

    hideStatus() {
        document.getElementById('report-status-section').classList.add('hidden');
    }

    showReportError(message) {
        document.getElementById('report-status-section').classList.remove('hidden');
        document.getElementById('report-loading').classList.add('hidden');
        document.getElementById('report-error').classList.remove('hidden');
        document.getElementById('report-error-message').textContent = message;
    }
}