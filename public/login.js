function showPopup(title, message) {
    const popup = document.getElementById('customPopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');

    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popup.style.display = 'block';

    // Automatically hide the popup after 3 seconds
    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showPopup('Error', 'Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('sessionId', data.sessionId);
            window.location.href = '/admin.html';
        } else {
            const errorData = await response.json();
            showPopup('Error', errorData.error || 'An error occurred during login.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showPopup('Error', 'An error occurred during login. Please try again later.');
    }
}
