const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        console.log('Attempting login with:', formData);
        const response = await api.post('auth/login', formData);
        console.log('Login response:', response.data);
        
        // Store token
        localStorage.setItem('token', response.data.token);
        
        // Update auth context
        login(response.data);
        
        // Redirect
        navigate('/');
    } catch (err) {
        console.error('Login error:', err);
        setError(err.response?.data?.error || 'Failed to login');
    }
};
