import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../MeetingScheduler.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [meetingsCount, setMeetingsCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [nextMeeting, setNextMeeting] = useState(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userData = allUsers.find(u => u.email === currentUser.email);
    setUser(userData);
    setUsername(userData.username);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    let expired = 0;
    let upcoming = 0;
    let next = null;
    if (userData.meetings && userData.meetings.length > 0) {
      setMeetingsCount(userData.meetings.length);
      // Sort meetings by date+time
      const sorted = [...userData.meetings].sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));
      // Count expired and upcoming by date only
      sorted.forEach(m => {
        if (m.date < todayStr) {
          expired++;
        } else {
          upcoming++;
        }
      });
      setExpiredCount(expired);
      setUpcomingCount(upcoming);
      // Find next meeting (first with date today or later)
      next = sorted.find(m => m.date >= todayStr);
      setNextMeeting(next || null);
    } else {
      setMeetingsCount(0);
      setExpiredCount(0);
      setUpcomingCount(0);
      setNextMeeting(null);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setMessage('');
    if (password && password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = allUsers.findIndex(u => u.email === user.email);
    if (idx !== -1) {
      allUsers[idx].username = username;
      if (password) allUsers[idx].password = password;
      localStorage.setItem('users', JSON.stringify(allUsers));
      localStorage.setItem('currentUser', JSON.stringify({ username, email: user.email }));
      setMessage('Profile updated successfully!');
    }
  };

  if (!user) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className="login-bg">
      <div className="login-container" style={{ maxWidth: 400 }}>
        <h2 className="login-title">User Profile</h2>
        <form onSubmit={handleSave}>
          <div className="login-field">
            <label className="login-label">Username</label>
            <input
              className="login-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              className="login-input"
              value={user.email}
              disabled
            />
          </div>
          <div className="login-field">
            <label className="login-label">New Password</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="login-field">
            <label className="login-label">Confirm Password</label>
            <input
              className="login-input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <button className="login-btn" type="submit" style={{ width: '100%' }}>Save Changes</button>
        </form>
        {message && <div className="login-error" style={{ marginTop: 10, background: '#d1fae5', color: '#065f46', border: '1px solid #10b981' }}>{message}</div>}
        <div style={{ marginTop: 24, color: '#374151', fontSize: '1rem' }}>
          <div><b>Meetings scheduled:</b> {meetingsCount}</div>
          <div><b>Expired meetings:</b> {expiredCount}</div>
          <div><b>Upcoming meetings:</b> {upcomingCount}</div>
          {nextMeeting && (
            <div style={{ marginTop: 16, padding: '1rem', background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px #e0e7ef' }}>
              <span style={{ fontSize: 32, color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="5" fill="#2563eb" rx="2"/><path fill="#fff" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm-4 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9H3Zm5 3a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Z"/></svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e293b', marginBottom: 4 }}>{nextMeeting.name}</div>
                <div style={{ fontSize: '1.05rem', color: '#2563eb', marginBottom: 2 }}>
                  {new Date(nextMeeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '1rem', color: '#334155' }}>
                  {nextMeeting.startTime} - {nextMeeting.endTime}
                </div>
              </div>
            </div>
          )}
          {!nextMeeting && upcomingCount === 0 && <div style={{ marginTop: 8, color: '#6b7280' }}>No upcoming meetings.</div>}
        </div>
        <button
          type="button"
          className="login-btn"
          style={{ marginTop: 24, background: '#6b7280' }}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default Profile; 