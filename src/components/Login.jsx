import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../MeetingScheduler.css';

function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Find user
    const user = users.find(u => u.email === formData.email && u.password === formData.password);

    if (user) {
      // Store current user
      localStorage.setItem('currentUser', JSON.stringify({
        username: user.username,
        email: user.email
      }));
      setIsAuthenticated(true);
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="login-input"
              required
            />
          </div>
          <div className="login-field">
            <label className="login-label" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="login-input"
              required
            />
          </div>
          <div className="login-actions">
            <button
              type="submit"
              className="login-btn"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="login-link"
            >
              Need an account?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login; 