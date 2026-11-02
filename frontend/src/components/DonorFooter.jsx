import "./DonorFooter.css";

function DonorFooter() {
  return (
    <footer className="donor-footer">
      <div className="donor-footer-brand">
        <span className="donor-footer-heart" aria-hidden="true">♥</span>
        <div>
          <strong>BloodCare</strong>
          <span>Every donation gives hope.</span>
        </div>
      </div>
      <div className="donor-footer-message">
        <span className="donor-footer-pulse" aria-hidden="true" />
        Thank you for helping save lives
      </div>
      <small>© {new Date().getFullYear()} BloodCare</small>
    </footer>
  );
}

export default DonorFooter;
