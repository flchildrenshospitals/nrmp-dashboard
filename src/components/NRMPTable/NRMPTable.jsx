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

  const baseHeaders = headers.filter(
    h => !h.match(/^\d{4} (Quota|Matched)$/)
  );
  const visibleHeaders = [...baseHeaders, ...yearCols];

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
              {visibleHeaders.map((col) => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
