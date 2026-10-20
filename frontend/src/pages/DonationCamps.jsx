import { useMemo, useState } from "react";
import "./DonationCamps.css";

const camps = [
  {
    id: 1,
    name: "University of Ruhuna",
    address: "Faculty of Technology, Hapugala",
    date: "24 Jun 2025",
    time: "8:30 AM - 3:00 PM",
    coordinates: "6.0367,80.5860",
  },
  {
    id: 2,
    name: "Matara General Hospital",
    address: "Uyanwatta, Matara",
    date: "02 Jul 2025",
    time: "9:00 AM - 2:00 PM",
    coordinates: "5.9485,80.5353",
  },
  {
    id: 3,
    name: "Galle Blood Bank",
    address: "Richmond Hill, Galle",
    date: "08 Jul 2025",
    time: "8:00 AM - 1:00 PM",
    coordinates: "6.0329,80.2168",
  },
  {
    id: 4,
    name: "Teaching Hospital Karapitiya",
    address: "Hirimbura Cross Road, Galle",
    date: "15 Jul 2025",
    time: "8:30 AM - 3:30 PM",
    coordinates: "6.0498,80.2820",
  },
];

function DonationCamps({ user, onBack, onLogout }) {
  const [search, setSearch] = useState("");
  const [selectedCamp, setSelectedCamp] = useState(camps[0]);
  const firstName = user.name?.split(" ")[0] || "Donor";

  const filteredCamps = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return camps;
    return camps.filter((camp) =>
      `${camp.name} ${camp.address}`.toLowerCase().includes(query),
    );
  }, [search]);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearch(value);
    const nextCamp = camps.find((camp) =>
      `${camp.name} ${camp.address}`.toLowerCase().includes(value.trim().toLowerCase()),
    );
    if (nextCamp) setSelectedCamp(nextCamp);
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=80.15%2C5.85%2C80.65%2C6.15&layer=mapnik&marker=${selectedCamp.coordinates}`;

  return (
    <main className="camps-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon"><HeartIcon /></div>
          <span>BloodCare</span>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <button className="dashboard-nav-item" onClick={onBack} type="button">
            <DashboardIcon /> Overview
          </button>
          <button className="dashboard-nav-item dashboard-nav-item-active" type="button">
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

      <section className="camps-content">
        <header className="camps-header">
          <div>
            <button className="back-button" onClick={onBack} type="button">
              <ArrowBackIcon /> Back to overview
            </button>
            <p className="dashboard-eyebrow">Donation camps</p>
            <h1>Find a camp near you, {firstName}.</h1>
            <p className="dashboard-subtitle">Choose a convenient location and make your next life-saving donation.</p>
          </div>
          <div className="dashboard-user">
            <div className="dashboard-avatar">{firstName.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <span>Blood donor</span>
            </div>
          </div>
        </header>

        <div className="camp-search">
          <SearchIcon />
          <input
            aria-label="Search donation camps"
            onChange={handleSearch}
            placeholder="Search by city, hospital or camp name"
            type="search"
            value={search}
          />
        </div>

        <div className="camps-layout">
          <section className="map-panel">
            <div className="map-heading">
              <div>
                <p className="panel-eyebrow">Explore locations</p>
                <h2>Donation camps near you</h2>
              </div>
              <span className="location-count">{filteredCamps.length} camps</span>
            </div>
            <div className="map-frame">
              <iframe
                key={selectedCamp.id}
                title={`Map showing ${selectedCamp.name}`}
                src={mapUrl}
              />
            </div>
            <a
              className="map-link"
              href={`https://www.openstreetmap.org/?mlat=${selectedCamp.coordinates.split(",")[0]}&mlon=${selectedCamp.coordinates.split(",")[1]}#map=14/${selectedCamp.coordinates.replace(",", "/")}`}
              rel="noreferrer"
              target="_blank"
            >
              Open selected location in maps <ArrowIcon />
            </a>
          </section>

          <section className="camp-list-panel">
            <div className="map-heading">
              <div>
                <p className="panel-eyebrow">Available now</p>
                <h2>Upcoming camps</h2>
              </div>
            </div>
            <div className="camp-list">
              {filteredCamps.length ? filteredCamps.map((camp) => (
                <button
                  className={`camp-location ${selectedCamp.id === camp.id ? "camp-location-active" : ""}`}
                  key={camp.id}
                  onClick={() => setSelectedCamp(camp)}
                  type="button"
                >
                  <span className="camp-location-icon"><MapPinIcon /></span>
                  <span className="camp-location-details">
                    <strong>{camp.name}</strong>
                    <span>{camp.address}</span>
                    <small>{camp.date} · {camp.time}</small>
                  </span>
                  <ArrowIcon />
                </button>
              )) : (
                <p className="empty-camps">No donation camps match your search.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function HeartIcon() {
  return <svg className="dashboard-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" /></svg>;
}

function ArrowIcon() {
  return <svg className="dashboard-icon small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ArrowBackIcon() {
  return <svg className="dashboard-icon small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6M9 12h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function SearchIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" strokeWidth="2" /><path d="m20 20-4-4" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function MapPinIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" strokeWidth="2" /><circle cx="12" cy="10" r="2.5" strokeWidth="2" /></svg>;
}

function DashboardIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="14" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="14" /></svg>;
}

function CalendarIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="16" rx="2" strokeWidth="2" width="18" x="3" y="5" /><path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" /></svg>;
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

export default DonationCamps;
