import "./Header.css";

export default function Header({ csvUrl, csvFilename }) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        <div className="dashboard-header-copy">
          <p className="dashboard-eyebrow">NRMP 2020-2026</p>
          <h1>Explore residency match trends in Florida</h1>
          <p className="dashboard-tagline">
            Filter by specialty, institution type, and year range to understand
            sponsoring institution outcomes at a glance.
          </p>
        </div>
        <a
          className="csv-download-link"
          href={csvUrl}
          download={csvFilename}
        >
          Download CSV data
        </a>
      </div>
    </header>
  );
}
