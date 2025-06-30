import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import '../MeetingScheduler.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [meetings, setMeetings] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: false,
    recurringDays: []
  });
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00'
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
      navigate('/login');
      return;
    }

    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = allUsers.find(u => u.email === user.email);
    if (currentUser) {
      setMeetings(currentUser.meetings || []);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleDateChange = (direction) => {
    setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  const handleWeekChange = (direction) => {
    setCurrentWeek(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  const handleWorkingHoursChange = (type, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      name: meeting.name,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      isRecurring: meeting.isRecurring || false,
      recurringDays: meeting.recurringDays || []
    });
  };

  const handleMeetingSubmit = (e) => {
    e.preventDefault();
    
    // Validate meeting time
    if (formData.startTime < workingHours.start || formData.endTime > workingHours.end) {
      alert('Meeting time must be within working hours');
      return;
    }

    // Check for conflicts (excluding the current meeting if editing)
    const hasConflict = meetings.some(meeting => {
      if (meeting.id === editingMeeting?.id) return false;
      if (formData.isRecurring) {
        return formData.recurringDays.some(day => {
          if (day === meeting.date) {
            return (
              (formData.startTime >= meeting.startTime && formData.startTime < meeting.endTime) ||
              (formData.endTime > meeting.startTime && formData.endTime <= meeting.endTime)
            );
          }
          return false;
        });
      } else {
        if (meeting.date === formData.date) {
          return (
            (formData.startTime >= meeting.startTime && formData.startTime < meeting.endTime) ||
            (formData.endTime > meeting.startTime && formData.endTime <= meeting.endTime)
          );
        }
      }
      return false;
    });

    if (hasConflict) {
      alert('Meeting time conflicts with existing meeting');
      return;
    }

    let updatedMeetings;
    if (editingMeeting) {
      // Update existing meeting
      updatedMeetings = meetings.map(m => 
        m.id === editingMeeting.id 
          ? { ...m, ...formData }
          : m
      );
    } else {
      // Add new meeting(s)
      if (formData.isRecurring) {
        const newMeetings = formData.recurringDays.map(day => ({
          id: Date.now() + Math.random(),
          ...formData,
          date: day
        }));
        updatedMeetings = [...meetings, ...newMeetings];
      } else {
        const newMeeting = {
          id: Date.now(),
          ...formData
        };
        updatedMeetings = [...meetings, newMeeting];
      }
    }

    setMeetings(updatedMeetings);

    // Update localStorage
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userIndex = allUsers.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
      allUsers[userIndex].meetings = updatedMeetings;
      localStorage.setItem('users', JSON.stringify(allUsers));
    }

    // Reset form and editing state
    setFormData({
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: false,
      recurringDays: []
    });
    setEditingMeeting(null);
  };

  const handleCancelEdit = () => {
    setEditingMeeting(null);
    setFormData({
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: false,
      recurringDays: []
    });
  };

  const handleDeleteMeeting = (meetingId) => {
    const updatedMeetings = meetings.filter(m => m.id !== meetingId);
    setMeetings(updatedMeetings);

    // Update localStorage
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userIndex = allUsers.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
      allUsers[userIndex].meetings = updatedMeetings;
      localStorage.setItem('users', JSON.stringify(allUsers));
    }
  };

  const getMeetingsForDate = (date) => {
    return meetings.filter(m => m.date === format(date, 'yyyy-MM-dd'));
  };

  const calculateFreeTime = (date) => {
    const dayMeetings = getMeetingsForDate(date);
    let freeTime = 0;
    const start = new Date(`2000-01-01T${workingHours.start}`);
    const end = new Date(`2000-01-01T${workingHours.end}`);
    const totalMinutes = (end - start) / (1000 * 60);

    if (dayMeetings.length === 0) {
      return totalMinutes;
    }

    dayMeetings.forEach(meeting => {
      const meetingStart = new Date(`2000-01-01T${meeting.startTime}`);
      const meetingEnd = new Date(`2000-01-01T${meeting.endTime}`);
      freeTime += (meetingEnd - meetingStart) / (1000 * 60);
    });

    return totalMinutes - freeTime;
  };

  const getTimeSlots = (date) => {
    const dayMeetings = getMeetingsForDate(date);
    const slots = [];
    let currentTime = workingHours.start;

    // Sort meetings by start time
    const sortedMeetings = [...dayMeetings].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Add free time and meeting slots
    sortedMeetings.forEach(meeting => {
      if (currentTime < meeting.startTime) {
        slots.push({
          type: 'free',
          startTime: currentTime,
          endTime: meeting.startTime
        });
      }
      slots.push({
        type: 'meeting',
        name: meeting.name,
        startTime: meeting.startTime,
        endTime: meeting.endTime
      });
      currentTime = meeting.endTime;
    });

    // Add remaining free time
    if (currentTime < workingHours.end) {
      slots.push({
        type: 'free',
        startTime: currentTime,
        endTime: workingHours.end
      });
    }

    return slots;
  };

  const chartData = {
    labels: ['Free Time', 'Meeting Time'],
    datasets: [
      {
        data: [
          calculateFreeTime(currentDate),
          (new Date(`2000-01-01T${workingHours.end}`) - new Date(`2000-01-01T${workingHours.start}`)) / (1000 * 60) - calculateFreeTime(currentDate)
        ],
        backgroundColor: ['#4CAF50', '#2196F3'],
      },
    ],
  };

  return (
    <div className="dashboard-bg">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <span className="dashboard-welcome">
            Welcome, {JSON.parse(localStorage.getItem('currentUser'))?.username}
          </span>
          <div className="dashboard-date-nav">
            <button onClick={() => handleDateChange('prev')} className="dashboard-nav-btn">
              <ChevronLeftIcon className="dashboard-nav-icon" />
            </button>
            <span className="dashboard-date">{format(currentDate, 'MMMM d, yyyy')}</span>
            <button onClick={() => handleDateChange('next')} className="dashboard-nav-btn">
              <ChevronRightIcon className="dashboard-nav-icon" />
            </button>
          </div>
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-working-hours">
            <input
              type="time"
              value={workingHours.start}
              onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
              className="dashboard-time-input"
            />
            <span>to</span>
            <input
              type="time"
              value={workingHours.end}
              onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
              className="dashboard-time-input"
            />
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="dashboard-profile-btn icon-btn"
            aria-label="Profile"
            title="Profile"
          >
            <span className="btn-icon-svg" style={{ verticalAlign: 'middle', marginRight: 6 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="currentColor"/><path fill="currentColor" d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1Z"/></svg>
            </span>
            <span className="btn-text">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="dashboard-logout-btn icon-btn"
            aria-label="Logout"
            title="Logout"
          >
            <span className="btn-icon-svg" style={{ verticalAlign: 'middle', marginRight: 6 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M16 17v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"/><path fill="currentColor" d="M21 12H9m0 0 3-3m-3 3 3 3"/></svg>
            </span>
            <span className="btn-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Week Overview */}
      <div className="dashboard-week-overview">
        <div className="dashboard-week-nav">
          <button onClick={() => handleWeekChange('prev')} className="dashboard-nav-btn">
            <ChevronLeftIcon className="dashboard-nav-icon" />
          </button>
          <span className="dashboard-week-title">Week Overview</span>
          <button onClick={() => handleWeekChange('next')} className="dashboard-nav-btn">
            <ChevronRightIcon className="dashboard-nav-icon" />
          </button>
        </div>
        <div className="dashboard-week-grid">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`dashboard-week-day ${
                format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                  ? 'dashboard-week-day-active'
                  : ''
              }`}
              onClick={() => setCurrentDate(day)}
              style={{ cursor: 'pointer' }}
            >
              <div className="dashboard-week-day-name">{format(day, 'EEE')}</div>
              <div className="dashboard-week-day-date">{format(day, 'MMM d')}</div>
              <div className="dashboard-week-day-meetings">
                {getMeetingsForDate(day).length} meetings
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Meeting Form */}
        <div className="dashboard-meeting-form">
          <h2 className="dashboard-section-title">Schedule Meeting</h2>
          <form onSubmit={handleMeetingSubmit}>
            <div className="dashboard-form-field">
              <label className="dashboard-form-label" htmlFor="meeting-name">
                Meeting Name
              </label>
              <input
                type="text"
                id="meeting-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="dashboard-form-input"
                required
              />
            </div>
            <div className="dashboard-form-field">
              <label className="dashboard-form-label" htmlFor="meeting-date">
                Date
              </label>
              <input
                type="date"
                id="meeting-date"
                name="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="dashboard-form-input"
                required
              />
            </div>
            <div className="dashboard-form-time">
              <div className="dashboard-form-field">
                <label className="dashboard-form-label" htmlFor="meeting-start">
                  Start Time
                </label>
                <input
                  type="time"
                  id="meeting-start"
                  name="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="dashboard-form-input"
                  required
                />
              </div>
              <div className="dashboard-form-field">
                <label className="dashboard-form-label" htmlFor="meeting-end">
                  End Time
                </label>
                <input
                  type="time"
                  id="meeting-end"
                  name="endTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="dashboard-form-input"
                  required
                />
              </div>
            </div>
            <div className="dashboard-form-field">
              <label className="dashboard-form-checkbox">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="dashboard-checkbox"
                />
                <span>Recurring Meeting</span>
              </label>
            </div>
            {formData.isRecurring && (
              <div className="dashboard-recurring-days">
                {weekDays.map((day, index) => (
                  <label key={index} className="dashboard-recurring-day">
                    <input
                      type="checkbox"
                      checked={formData.recurringDays.includes(format(day, 'yyyy-MM-dd'))}
                      onChange={(e) => {
                        const days = e.target.checked
                          ? [...formData.recurringDays, format(day, 'yyyy-MM-dd')]
                          : formData.recurringDays.filter(d => d !== format(day, 'yyyy-MM-dd'));
                        setFormData({ ...formData, recurringDays: days });
                      }}
                      className="dashboard-checkbox"
                    />
                    <span>{format(day, 'EEE')}</span>
                  </label>
                ))}
              </div>
            )}
            <button
              type="submit"
              className="dashboard-submit-btn"
            >
              {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
            {editingMeeting && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="dashboard-cancel-btn"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Meetings List */}
        <div className="dashboard-meetings-list">
          <h2 className="dashboard-section-title">Meetings for {format(currentDate, 'MMMM d, yyyy')}</h2>
          <div className="dashboard-meetings">
            {getMeetingsForDate(currentDate).length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
                <span style={{ fontSize: '1.1rem' }}>No meetings scheduled for this day.</span>
              </div>
            ) : (
              getMeetingsForDate(currentDate).map((meeting) => (
                <div key={meeting.id} className="dashboard-meeting-item">
                  <div className="dashboard-meeting-info">
                    <h3 className="dashboard-meeting-name">{meeting.name}</h3>
                    <p className="dashboard-meeting-time">
                      {meeting.startTime} - {meeting.endTime}
                    </p>
                  </div>
                  <div className="dashboard-meeting-actions">
                    <button
                      onClick={() => handleEditMeeting(meeting)}
                      className="dashboard-edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this meeting?')) {
                          handleDeleteMeeting(meeting.id);
                        }
                      }}
                      className="dashboard-delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Time Analysis */}
      <div className="dashboard-time-analysis">
        <h2 className="dashboard-section-title">Time Analysis</h2>
        <div className="dashboard-time-grid">
          <div className="dashboard-time-schedule">
            <h3 className="dashboard-time-title">Daily Schedule</h3>
            <div className="dashboard-time-list">
              {getTimeSlots(currentDate).map((slot, index) => (
                <div key={index} className={`dashboard-time-item ${slot.type === 'free' ? 'dashboard-time-item-free' : ''}`}>
                  <div className={`dashboard-time-dot ${slot.type === 'free' ? 'dashboard-time-dot-free' : ''}`}></div>
                  <span className="dashboard-time-name">
                    {slot.type === 'free' ? 'Free Time' : slot.name}
                  </span>
                  <span className="dashboard-time-range">
                    ({slot.startTime} - {slot.endTime})
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-time-chart">
            <h3 className="dashboard-time-title">Time Distribution</h3>
            <div className="dashboard-chart-container">
              <Pie data={chartData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 