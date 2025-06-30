import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../MeetingScheduler.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if email already exists
    if (users.some(user => user.email === formData.email)) {
      setError('Email already registered');
      return;
    }

    // Add new user
    const newUser = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      meetings: []
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Redirect to login
    navigate('/login');
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <h2 className="login-title">Register</h2>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="login-input"
              required
            />
          </div>
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
          <div className="login-field">
            <label className="login-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
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
              Register
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="login-link"
            >
              Already have an account?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register; 