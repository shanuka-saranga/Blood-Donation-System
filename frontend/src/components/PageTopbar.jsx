import "./PageTopbar.css";

function PageTopbar({ user, onOpenProfile }) {
  const firstName = user.name?.split(" ")[0] || "Donor";

  return (
    <div className="page-topbar">
      <button
        aria-label="Open profile"
        className="page-profile-button"
        onClick={onOpenProfile}
        type="button"
      >
        <div className="dashboard-avatar">
          {user.profilePicture ? (
            <img alt="" src={user.profilePicture} />
          ) : (
            firstName.charAt(0).toUpperCase()
          )}
        </div>
      </button>
      <span className="page-user-role">{user.role || "donor"}</span>
    </div>
  );
}

export default PageTopbar;
