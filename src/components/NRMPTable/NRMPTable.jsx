import { useEffect, useState } from "react";

const CSV_URL = `${import.meta.env.BASE_URL}NRMP_2020_2025_Main_and_Specialty.csv`;

export default function NRMPTable() {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    console.log("Fetching:", CSV_URL);
    fetch(CSV_URL)
      .then((r) => r.text())
      .then((text) => {
        console.log("Raw text:", text.slice(0, 200)); // Only first 200 chars for brevity
        const lines = text.trim().split("\n").filter(Boolean);
        if (lines.length === 0) {
          console.log("No lines found in CSV!");
          return;
        }
        const rawHeaders = lines[0].split(",");
        setHeaders(rawHeaders.map(h => h.trim()));
        setRows(
          lines.slice(1).map(line => {
            const cells = line.split(",");
            while (cells.length < rawHeaders.length) cells.push("");
            return cells;
          })
        );
        console.log("Headers:", rawHeaders);
        console.log("First row:", lines[1]);
      })
      .catch(err => {
        console.error("Fetch or parse error:", err);
      });
  }, []);

  if (!rows.length) {
    return <div>Loading table...</div>;
  }

  return (
    <div style={{ overflowX: "auto", background: "#fff", borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.08)", padding: 16 }}>
      <table>
        <thead>
          <tr>
            {headers.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
