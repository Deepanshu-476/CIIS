import "./CIISLOADER.css";

export default function CIISLoader() {
  return (
    <div className="ciis-wrapper" role="status" aria-live="polite" aria-busy="true">
      <div className="ciis-card">
        <img className="ciis-logo" src="/logoo.png" alt="CIIS Network" />
        <div className="premium-spinner-container" aria-hidden="true">
          <div className="outer-ring" />
          <div className="inner-ring" />
        </div>
        <div className="loading-text fade-in">Loading...</div>
      </div>
    </div>
  );
}
