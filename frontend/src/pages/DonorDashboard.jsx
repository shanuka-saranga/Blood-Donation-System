import "./DonorDashboard.css";

function DonorDashboard({ user, onLogout }) {
  const firstName = user.name?.split(" ")[0] || "Donor";

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon"><HeartIcon /></div>
          <span>BloodCare</span>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <button className="dashboard-nav-item dashboard-nav-item-active" type="button">
            <DashboardIcon /> Overview
          </button>
          <button className="dashboard-nav-item" type="button">
            <CalendarIcon /> Donation camps
          </button>
          <button className="dashboard-nav-item" type="button">
            <HistoryIcon /> My donations
          </button>
          <button className="dashboard-nav-item" type="button">
            <ProfileIcon /> My profile
          </button>
        </nav>

        <button className="dashboard-logout" onClick={onLogout} type="button">
          <LogoutIcon /> Log out
        </button>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Donor dashboard</p>
            <h1>Good morning, {firstName}!</h1>
            <p className="dashboard-subtitle">Your generosity can save up to three lives.</p>
          </div>
          <div className="dashboard-user">
            <div className="dashboard-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <span>Blood donor</span>
            </div>
          </div>
        </header>

        <section className="dashboard-hero-card">
          <div>
            <span className="hero-card-label">Your next opportunity</span>
            <h2>Be someone's reason to live.</h2>
            <p>Find a nearby blood donation camp and make your next life-saving donation.</p>
            <button className="primary-dashboard-button" type="button">
              Find a donation camp <ArrowIcon />
            </button>
          </div>
          <div className="hero-card-heart"><HeartIcon /></div>
        </section>

        <section className="dashboard-stats" aria-label="Donation statistics">
          <StatCard icon={<HeartIcon />} value="3" label="Total donations" tone="red" />
          <StatCard icon={<CalendarIcon />} value="12 Jun" label="Last donation" tone="blue" />
          <StatCard icon={<CheckIcon />} value="Eligible" label="Donation status" tone="green" />
        </section>

        <div className="dashboard-grid">
          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">Stay ready</p>
                <h2>Donation eligibility</h2>
              </div>
              <span className="status-pill">Eligible now</span>
            </div>
            <div className="eligibility-row">
              <div className="eligibility-icon"><CheckIcon /></div>
              <div>
                <strong>You can donate blood</strong>
                <p>Your last donation was more than 3 months ago.</p>
              </div>
            </div>
            <div className="progress-track"><span /></div>
            <p className="progress-caption">Ready to help someone in need</p>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">Coming soon</p>
                <h2>Upcoming camps</h2>
              </div>
              <button className="text-button" type="button">View all</button>
            </div>
            <div className="camp-item">
              <div className="camp-date"><strong>24</strong><span>JUN</span></div>
              <div><strong>University of Ruhuna</strong><p>8:30 AM · Faculty of Technology</p></div>
              <ArrowIcon />
            </div>
            <div className="camp-item">
              <div className="camp-date"><strong>02</strong><span>JUL</span></div>
              <div><strong>Matara General Hospital</strong><p>9:00 AM · Blood bank unit</p></div>
              <ArrowIcon />
            </div>
          </section>
        </div>

        <section className="dashboard-panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Your journey</p>
              <h2>Recent activity</h2>
            </div>
          </div>
          <div className="activity-list">
            <Activity icon={<CheckIcon />} title="Donation completed" description="Your blood donation was recorded successfully." date="12 Jun 2025" />
            <Activity icon={<CalendarIcon />} title="Camp reminder" description="You registered interest in the University of Ruhuna camp." date="05 Jun 2025" />
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({ icon, value, label, tone }) {
  return <div className="stat-card"><div className={`stat-icon stat-icon-${tone}`}>{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function Activity({ icon, title, description, date }) {
  return <div className="activity-item"><div className="activity-icon">{icon}</div><div><strong>{title}</strong><p>{description}</p></div><time>{date}</time></div>;
}

function HeartIcon() {
  return <svg className="dashboard-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" /></svg>;
}

function ArrowIcon() {
  return <svg className="dashboard-icon small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function DashboardIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="14" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="14" /></svg>;
}

function CalendarIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="16" rx="2" width="18" x="3" y="5" /><path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function HistoryIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ProfileIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="2" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function LogoutIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function CheckIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>;
}

export default DonorDashboard;
