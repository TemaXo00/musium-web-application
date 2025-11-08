class AuthHandler {
    constructor() {
        this.init();
    }

    init() {
        this.handleLogin();
        this.handleRegister();
        this.handleLogout();
    }

    handleLogin() {
        const loginForm = document.querySelector('.login-form');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitLogin(loginForm);
        });
    }

    handleRegister() {
        const registerForm = document.querySelector('.register-form');
        if (!registerForm) return;

        const userTypeButtons = document.querySelectorAll('.register-type__button');
        let selectedType = 'User';

        userTypeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                userTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                selectedType = button.textContent.trim() === 'Author' ? 'Author' : 'User';
            });
        });

        if (userTypeButtons[0]) {
            userTypeButtons[0].classList.add('active');
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitRegister(registerForm, selectedType);
        });
    }

    handleLogout() {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.submitLogout();
            });
        }
    }

    async submitLogin(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        try {
            submitButton.textContent = 'Signing in...';
            submitButton.disabled = true;

            const formData = {
                email: document.querySelector('input[placeholder="Email Address"]')?.value,
                password: document.querySelector('input[placeholder="Password"]')?.value
            };

            if (!formData.email || !formData.password) {
                throw new Error('Please fill in all fields');
            }

            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = '/';
            } else {
                throw new Error(result.error || 'Login failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    async submitRegister(form, userType) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        try {
            submitButton.textContent = 'Creating account...';
            submitButton.disabled = true;

            const formData = {
                nickname: document.querySelector('input[placeholder="Nickname"]')?.value,
                email: document.querySelector('input[placeholder="Email Address"]')?.value,
                password: document.querySelector('input[placeholder="Password"]')?.value,
                userType: userType
            };

            if (!formData.nickname || !formData.email || !formData.password) {
                throw new Error('Please fill in all fields');
            }

            if (formData.password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = '/';
            } else {
                throw new Error(result.error || 'Registration failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    async submitLogout() {
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
    new AuthHandler();
});