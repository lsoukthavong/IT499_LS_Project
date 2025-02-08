document.getElementById('loginButton').addEventListener('click', async () => {
    const server = document.getElementById('server').value;
    const database = document.getElementById('database').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const loginData = {
        server: 'localhost',
        database: 'nursery',
        user: username,
        password: password
    };

    try {
        const response = await fetch('http://localhost:5501/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('loginResult').innerHTML = `<p>${result.message}</p>`;
            // Redirect to another page or perform other actions upon successful login
        } else {
            document.getElementById('loginResult').innerHTML = `<p>${result.message}</p>`;
        }
    } catch (error) {
        console.error('Error during login:', error);
        document.getElementById('loginResult').innerHTML = '<p>Login failed. Please try again.</p>';
    }
});