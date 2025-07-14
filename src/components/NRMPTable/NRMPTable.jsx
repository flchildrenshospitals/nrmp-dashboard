import React, { useState } from "react";
import "./NRMPTable.css";

export default function NRMPTable({ data, headers, yearRange, selectedSpecialties, sliderComponent }) {
  const [showYearlyData, setShowYearlyData] = useState(false);
  
  if (!data.length) return <div>Loading table...</div>;

  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  const inRangeYears = years.filter(y => y >= yearRange[0] && y <= yearRange[1]);
  const yearCols = [];
  inRangeYears.forEach(y => {
    yearCols.push(`${y} Quota`, `${y} Matched`);
  });

  // Get base headers (non-year columns) and exclude unwanted columns
  const columnsToHide = ["Sponsoring Institution", "City", "Specialty"];
  const baseHeaders = headers.filter(
    h => !h.match(/^\d{4} (Quota|Matched)$/) && !columnsToHide.includes(h)
  );

  // Find the index of PROGRAM CODE column (try different possible names)
  let programCodeIndex = baseHeaders.findIndex(h => h === "PROGRAM CODE");
  if (programCodeIndex === -1) {
    programCodeIndex = baseHeaders.findIndex(h => h.includes("PROGRAM") && h.includes("CODE"));
  }
  if (programCodeIndex === -1) {
    programCodeIndex = baseHeaders.findIndex(h => h.toLowerCase().includes("program") && h.toLowerCase().includes("code"));
  }
  
  // Create headers for summary table (base headers + summary columns)
  let summaryHeaders;
  if (programCodeIndex !== -1) {
    const beforeProgramCode = baseHeaders.slice(0, programCodeIndex + 1);
    const afterProgramCode = baseHeaders.slice(programCodeIndex + 1);
    const summaryColumns = ["SOLICITED", "MATCHED", "NOT MATCHED", "MATCH %"];
    summaryHeaders = [...beforeProgramCode, ...summaryColumns, ...afterProgramCode];
  } else {
    const summaryColumns = ["SOLICITED", "MATCHED", "NOT MATCHED", "MATCH %"];
    summaryHeaders = [...baseHeaders, ...summaryColumns];
  }

  // Create headers for detailed table (only year columns)
  const detailedHeaders = yearCols;

  // Function to calculate summary values for a row
  const calculateSummary = (row, type) => {
    let total = 0;
    inRangeYears.forEach(year => {
      const colName = `${year} ${type}`;
      const value = parseInt(row[colName] || 0, 10);
      total += value;
    });
    return total;
  };

  // Filter out meaningless rows and apply specialty filter
  const filteredData = data.filter(row => {
    // Check if row has any quota data for the selected years
    const hasSolicitedData = calculateSummary(row, "Quota") > 0;
    const hasMatchedData = calculateSummary(row, "Matched") > 0;
    
    // Check if key identifying fields are present
    const hasProgram = row["PROGRAM CODE"] && row["PROGRAM CODE"].trim() !== "";
    const hasSpecialty = baseHeaders.some(header => 
      header.toLowerCase().includes("specialty") && 
      row[header] && 
      row[header].trim() !== ""
    );
    
    // Check if specialty is selected (if filter is active)
    const specialtyMatch = selectedSpecialties.length === 0 || 
      selectedSpecialties.includes(row["Specialty Cleaned"]);
    
    // Keep row if it has data AND identifying information AND matches specialty filter
    return (hasSolicitedData || hasMatchedData) && (hasProgram || hasSpecialty) && specialtyMatch;
  });

  // Count unique sponsoring institutions in filtered data
  const uniqueInstitutionsCount = new Set(
    filteredData
      .map(row => row["Sponsoring Institution Cleaned"])
      .filter(institution => institution && institution.trim() !== "")
  ).size;

  return (
    <div className="nrmp-dashboard-container">
      {/* Slider Section */}
      <div className="dashboard-header-section">
        {sliderComponent}
      </div>

      {/* Table Header with Toggle */}
      <div className="table-header-row">
        <h3 className="table-title">
          NRMP Data for {selectedSpecialties.length === 0 ? "All" : "Selected"} Specialties ({yearRange[0]} - {yearRange[1]}) - {uniqueInstitutionsCount} Sponsoring Institutions
        </h3>
        <button 
          className={`yearly-data-toggle ${showYearlyData ? 'active' : ''}`}
          onClick={() => setShowYearlyData(!showYearlyData)}
          aria-label={showYearlyData ? "Hide yearly data" : "Show yearly data"}
        >
          <span className="toggle-icon">{showYearlyData ? '◀' : '▶'}</span>
          <span className="toggle-text">{showYearlyData ? 'Hide' : 'Show'} Yearly Data</span>
        </button>
      </div>

      {/* Tables Container */}
      <div className={`tables-container ${showYearlyData ? 'show-yearly' : ''}`}>
        {/* Summary Table */}
        <div className="table-section summary-section">
          <div className="nrmp-table-container">
            {filteredData.length === 0 ? (
              <div className="no-data-message">
                <p>No data found for the selected specialties.</p>
                <p>Try selecting different specialties or adjusting the year range.</p>
              </div>
            ) : (
              <table className="nrmp-table">
                <thead>
                  <tr>
                    {summaryHeaders.map((col) => {
                      // Clean up column names for display
                      let displayName = col;
                      if (col === "Sponsoring Institution Cleaned") displayName = "SPONSORING INSTITUTION";
                      if (col === "City Cleaned") displayName = "CITY";
                      if (col === "Specialty Cleaned") displayName = "SPECIALTY";
                      
                      return (
                        <th key={col} className={col === "SOLICITED" || col === "MATCHED" || col === "NOT MATCHED" || col === "MATCH %" ? "summary-column-header" : ""}>
                          {displayName}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, i) => (
                    <tr key={i}>
                      {summaryHeaders.map((col) => {
                        if (col === "SOLICITED") {
                          return <td key={col} className="summary-column">{calculateSummary(row, "Quota").toLocaleString()}</td>;
                        } else if (col === "MATCHED") {
                          return <td key={col} className="summary-column">{calculateSummary(row, "Matched").toLocaleString()}</td>;
                        } else if (col === "NOT MATCHED") {
                          const solicited = calculateSummary(row, "Quota");
                          const matched = calculateSummary(row, "Matched");
                          const notMatched = solicited - matched;
                          return <td key={col} className="summary-column">{notMatched.toLocaleString()}</td>;
                        } else if (col === "MATCH %") {
                          const solicited = calculateSummary(row, "Quota");
                          const matched = calculateSummary(row, "Matched");
                          const matchPercentage = solicited > 0 ? ((matched / solicited) * 100).toFixed(1) : "0.0";
                          return <td key={col} className="summary-column">{matchPercentage}%</td>;
                        } else {
                          return <td key={col}>{row[col]}</td>;
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Yearly Data Table */}
        {showYearlyData && (
          <div className="table-section yearly-section">
            <div className="nrmp-table-container">
              {filteredData.length === 0 ? (
                <div className="no-data-message">
                  <p>No data found for the selected specialties.</p>
                  <p>Try selecting different specialties or adjusting the year range.</p>
                </div>
              ) : (
                <table className="nrmp-table yearly-table">
                  <thead>
                    <tr>
                      {detailedHeaders.map((col) => {
                        // Format headers to put year on first line, type on second line
                        const parts = col.split(' ');
                        const year = parts[0];
                        const type = parts[1];
                        return (
                          <th key={col}>
                            <div>{year}</div>
                            <div>{type}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, i) => (
                      <tr key={i}>
                        {detailedHeaders.map((col) => (
                          <td key={col}>{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
