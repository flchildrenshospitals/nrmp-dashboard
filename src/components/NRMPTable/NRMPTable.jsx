import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "./NRMPTable.css";

const CSV_URL = `${import.meta.env.BASE_URL}NRMP_2020_2025_Main_and_Specialty.csv`;

export default function NRMPTable({ yearRange }) {
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

  // Debug: log headers to see what we're working with
  console.log("Base headers:", baseHeaders);
  
  // Find the index of PROGRAM CODE column (try different possible names)
  let programCodeIndex = baseHeaders.findIndex(h => h === "PROGRAM CODE");
  if (programCodeIndex === -1) {
    programCodeIndex = baseHeaders.findIndex(h => h.includes("PROGRAM") && h.includes("CODE"));
  }
  if (programCodeIndex === -1) {
    programCodeIndex = baseHeaders.findIndex(h => h.toLowerCase().includes("program") && h.toLowerCase().includes("code"));
  }
  
  console.log("Program code index:", programCodeIndex);
  console.log("Program code column:", baseHeaders[programCodeIndex]);
  
  // Create headers with summary columns inserted after PROGRAM CODE
  let visibleHeaders;
  if (programCodeIndex !== -1) {
    const beforeProgramCode = baseHeaders.slice(0, programCodeIndex + 1);
    const afterProgramCode = baseHeaders.slice(programCodeIndex + 1);
    const summaryHeaders = ["SOLICITED", "MATCHED"];
    visibleHeaders = [...beforeProgramCode, ...summaryHeaders, ...afterProgramCode, ...yearCols];
  } else {
    // Fallback: if PROGRAM CODE not found, add summary columns at the end of base headers
    console.warn("PROGRAM CODE column not found, adding summary columns at end of base headers");
    const summaryHeaders = ["SOLICITED", "MATCHED"];
    visibleHeaders = [...baseHeaders, ...summaryHeaders, ...yearCols];
  }

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

  return (
    <div className="nrmp-table-container">
      <table className="nrmp-table">
        <thead>
          <tr>
            {visibleHeaders.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {visibleHeaders.map((col) => {
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
  );
}
