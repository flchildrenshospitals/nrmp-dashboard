import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./NRMPTable.css";

const CSV_URL = `${import.meta.env.BASE_URL}NRMP_2020_2025_Main_and_Specialty.csv`;

export default function NRMPTable({ yearRange, headerComponent, sliderComponent }) {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setData(results.data);
      },
    });
  }, []);

  if (!data.length) return <div>Loading table...</div>;

  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  const inRangeYears = years.filter(y => y >= yearRange[0] && y <= yearRange[1]);
  const yearCols = [];
  inRangeYears.forEach(y => {
    yearCols.push(`${y} Quota`, `${y} Matched`);
  });

  // Get base headers (non-year columns)
  const baseHeaders = headers.filter(
    h => !h.match(/^\d{4} (Quota|Matched)$/)
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
    const summaryColumns = ["SOLICITED", "MATCHED"];
    summaryHeaders = [...beforeProgramCode, ...summaryColumns, ...afterProgramCode];
  } else {
    const summaryColumns = ["SOLICITED", "MATCHED"];
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

  // Filter out meaningless rows (rows with no quota data or empty key fields)
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
    
    // Keep row if it has data AND identifying information
    return (hasSolicitedData || hasMatchedData) && (hasProgram || hasSpecialty);
  });

  return (
    <div className="nrmp-dashboard-container">
      {/* Header and Slider Section */}
      <div className="dashboard-header-section">
        {headerComponent}
        {sliderComponent}
      </div>

      {/* Aligned Tables Container */}
      <div className="nrmp-tables-wrapper">
        {/* Summary Table */}
        <div className="table-section summary-section">
          <h3 className="table-title summary-table-title">NRMP Data for All Specialties ({yearRange[0]} - {yearRange[1]})</h3>
          <div className="nrmp-table-container">
            <table className="nrmp-table">
              <thead>
                <tr>
                  {summaryHeaders.map((col) => (
                    <th key={col} className={col === "SOLICITED" || col === "MATCHED" ? "summary-column-header" : ""}>{col}</th>
                  ))}
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
                      } else {
                        return <td key={col}>{row[col]}</td>;
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Yearly Table */}
        <div className="table-section detailed-section">
          <h3 className="table-title">Yearly Data ({yearRange[0]} - {yearRange[1]})</h3>
          <div className="nrmp-table-container">
            <table className="nrmp-table">
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
          </div>
        </div>
      </div>
    </div>
  );
}
