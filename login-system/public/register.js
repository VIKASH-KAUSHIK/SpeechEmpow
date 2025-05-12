document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');

    if (!registerForm) {
        console.error('Form with ID "registerForm" not found.');
        return;
    }

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirmPassword');

        const password = passwordField?.value.trim();
        const confirmPassword = confirmPasswordField?.value.trim();

        if (!password || !confirmPassword) {
            alert('Please enter and confirm your password.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const formData = new FormData(registerForm);
        const formDataObj = {};

        for (const [key, value] of formData.entries()) {
            formDataObj[key] = value.trim(); // Optional trim for safety
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            });

            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            const contentType = response.headers.get('Content-Type');
            let errorMsg = 'Registration failed';

            if (!response.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } else {
                    errorMsg = await response.text();
                }

                alert(errorMsg);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration. Please try again later.');
        }
    });
});
