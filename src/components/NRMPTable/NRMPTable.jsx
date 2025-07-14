import React, { useState } from "react";
import "./NRMPTable.css";

export default function NRMPTable({ data, headers, yearRange, selectedSpecialties, snhafFilter, sliderComponent }) {
  const [showYearlyData, setShowYearlyData] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  if (!data.length) return <div>Loading table...</div>;

  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  const inRangeYears = years.filter(y => y >= yearRange[0] && y <= yearRange[1]);
  const yearCols = [];
  inRangeYears.forEach(y => {
    yearCols.push(`${y} Quota`, `${y} Matched`);
  });

  // For institution-level aggregation, we only need the sponsoring institution column
  const baseHeaders = ["Sponsoring Institution Cleaned"];
  
  // Create headers for summary table (institution + summary columns)
  const summaryColumns = ["SOLICITED", "MATCHED", "NOT MATCHED", "MATCH %"];
  const summaryHeaders = [...baseHeaders, ...summaryColumns];

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

  // Filter and aggregate data by institution
  const filteredRowData = data.filter(row => {
    // Check if row has any quota data for the selected years
    const hasSolicitedData = calculateSummary(row, "Quota") > 0;
    const hasMatchedData = calculateSummary(row, "Matched") > 0;
    
    // Check if key identifying fields are present
    const hasInstitution = row["Sponsoring Institution Cleaned"] && row["Sponsoring Institution Cleaned"].trim() !== "";
    
    // Check if specialty is selected (if filter is active)
    const specialtyMatch = selectedSpecialties.length === 0 || 
      selectedSpecialties.includes(row["Specialty Cleaned"]);
    
    // Check SNHAF filter
    const snhafMatch = snhafFilter === 'ALL' || 
      (snhafFilter === 'SNHAF' && row["SNHAF"] === 'SNHAF') ||
      (snhafFilter === 'NOT' && row["SNHAF"] === 'NOT');
    
    // Keep row if it has data AND has institution AND matches specialty filter AND matches SNHAF filter
    return (hasSolicitedData || hasMatchedData) && hasInstitution && specialtyMatch && snhafMatch;
  });

  // Aggregate data by institution
  const institutionMap = new Map();
  
  filteredRowData.forEach(row => {
    const institution = row["Sponsoring Institution Cleaned"];
    
    if (!institutionMap.has(institution)) {
      // Initialize institution entry with zeros for all years
      const institutionData = {
        "Sponsoring Institution Cleaned": institution
      };
      
      // Initialize all year columns to 0
      years.forEach(year => {
        institutionData[`${year} Quota`] = 0;
        institutionData[`${year} Matched`] = 0;
      });
      
      institutionMap.set(institution, institutionData);
    }
    
    // Sum up the values for this institution
    const institutionData = institutionMap.get(institution);
    years.forEach(year => {
      const quotaValue = parseInt(row[`${year} Quota`] || 0, 10);
      const matchedValue = parseInt(row[`${year} Matched`] || 0, 10);
      institutionData[`${year} Quota`] += quotaValue;
      institutionData[`${year} Matched`] += matchedValue;
    });
  });

  // Convert map to array for table rendering
  let filteredData = Array.from(institutionMap.values());

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to filteredData
  if (sortConfig.key) {
    filteredData = [...filteredData].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'Sponsoring Institution Cleaned') {
        aValue = a[sortConfig.key] || '';
        bValue = b[sortConfig.key] || '';
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (sortConfig.key === 'SOLICITED') {
        aValue = calculateSummary(a, "Quota");
        bValue = calculateSummary(b, "Quota");
      } else if (sortConfig.key === 'MATCHED') {
        aValue = calculateSummary(a, "Matched");
        bValue = calculateSummary(b, "Matched");
      } else if (sortConfig.key === 'NOT MATCHED') {
        aValue = calculateSummary(a, "Quota") - calculateSummary(a, "Matched");
        bValue = calculateSummary(b, "Quota") - calculateSummary(b, "Matched");
      } else if (sortConfig.key === 'MATCH %') {
        const aSolicited = calculateSummary(a, "Quota");
        const aMatched = calculateSummary(a, "Matched");
        aValue = aSolicited > 0 ? (aMatched / aSolicited) * 100 : 0;
        
        const bSolicited = calculateSummary(b, "Quota");
        const bMatched = calculateSummary(b, "Matched");
        bValue = bSolicited > 0 ? (bMatched / bSolicited) * 100 : 0;
      }

      if (sortConfig.key !== 'Sponsoring Institution Cleaned') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  }

  // Calculate totals for all institutions
  const totalSolicited = filteredData.reduce((sum, row) => sum + calculateSummary(row, "Quota"), 0);
  const totalMatched = filteredData.reduce((sum, row) => sum + calculateSummary(row, "Matched"), 0);
  const totalNotMatched = totalSolicited - totalMatched;
  const totalMatchPercentage = totalSolicited > 0 ? ((totalMatched / totalSolicited) * 100).toFixed(1) : "0.0";

  // Calculate yearly totals for each year column
  const yearlyTotals = {};
  yearCols.forEach(col => {
    yearlyTotals[col] = filteredData.reduce((sum, row) => {
      const value = parseInt(row[col] || 0, 10);
      return sum + value;
    }, 0);
  });

  // Count unique sponsoring institutions in filtered data (now one row per institution)
  const uniqueInstitutionsCount = filteredData.length;

  // Calculate median match percentage
  const matchPercentages = filteredData
    .map(row => {
      const solicited = calculateSummary(row, "Quota");
      const matched = calculateSummary(row, "Matched");
      return solicited > 0 ? (matched / solicited) * 100 : 0;
    })
    .filter(percentage => percentage >= 0) // Filter out any invalid percentages
    .sort((a, b) => a - b);

  const medianMatchPercentage = matchPercentages.length > 0 
    ? matchPercentages.length % 2 === 0
      ? ((matchPercentages[Math.floor(matchPercentages.length / 2) - 1] + matchPercentages[Math.floor(matchPercentages.length / 2)]) / 2).toFixed(1)
      : matchPercentages[Math.floor(matchPercentages.length / 2)].toFixed(1)
    : "0.0";

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
          <span className="median-match-stat"> | Median Match Rate: {medianMatchPercentage}%</span>
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
                      
                      // Add sort indicator
                      const getSortIndicator = () => {
                        if (sortConfig.key !== col) return ' ↕️';
                        return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
                      };
                      
                      return (
                        <th 
                          key={col} 
                          className={`${col === "SOLICITED" || col === "MATCHED" || col === "NOT MATCHED" || col === "MATCH %" ? "summary-column-header" : ""} sortable-header`}
                          onClick={() => handleSort(col)}
                        >
                          {displayName}{getSortIndicator()}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Total Row */}
                  <tr className="total-row">
                    {summaryHeaders.map((col) => {
                      if (col === "Sponsoring Institution Cleaned") {
                        return <td key={col} className="total-label"><strong>TOTAL</strong></td>;
                      } else if (col === "SOLICITED") {
                        return <td key={col} className="summary-column total-value"><strong>{totalSolicited.toLocaleString()}</strong></td>;
                      } else if (col === "MATCHED") {
                        return <td key={col} className="summary-column total-value"><strong>{totalMatched.toLocaleString()}</strong></td>;
                      } else if (col === "NOT MATCHED") {
                        return <td key={col} className="summary-column total-value"><strong>{totalNotMatched.toLocaleString()}</strong></td>;
                      } else if (col === "MATCH %") {
                        return <td key={col} className="summary-column total-value"><strong>{totalMatchPercentage}%</strong></td>;
                      } else {
                        return <td key={col}></td>;
                      }
                    })}
                  </tr>
                  
                  {/* Institution Rows */}
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
                        // Format year headers to put year on first line, type on second line
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
                    {/* Total Row */}
                    <tr className="total-row">
                      {detailedHeaders.map((col) => {
                        // Show yearly totals
                        const totalValue = yearlyTotals[col] || 0;
                        return <td key={col} className="total-value"><strong>{totalValue.toLocaleString()}</strong></td>;
                      })}
                    </tr>
                    
                    {/* Institution Rows */}
                    {filteredData.map((row, i) => (
                      <tr key={i}>
                        {detailedHeaders.map((col) => {
                          // Format numbers with commas
                          const value = parseInt(row[col] || 0, 10);
                          return <td key={col}>{value.toLocaleString()}</td>;
                        })}
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
