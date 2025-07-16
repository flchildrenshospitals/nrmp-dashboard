import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import Header from "./components/Header/Header";
import NRMPTable from "./components/NRMPTable/NRMPTable";
import YearSlider from "./components/YearSlider/YearSlider";
import SpecialtyFilter from "./components/SpecialtyFilter/SpecialtyFilter";
import SNHAFFilter from "./components/SNHAFFilter/SNHAFFilter";

// Update as appropriate based on your CSV
const MIN_YEAR = 2020;
const MAX_YEAR = 2025;
const CSV_URL = `${import.meta.env.BASE_URL}NRMP_2020_2025_Main_and_Specialty.csv`;

export default function App() {
  const [yearRange, setYearRange] = useState([MIN_YEAR, MAX_YEAR]);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [snhafFilter, setSnhafFilter] = useState('ALL'); // 'ALL', 'SNHAF', 'NOT'
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showAllSelectedSpecialties, setShowAllSelectedSpecialties] = useState(false);
  const specialtyFilterRef = useRef(null);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setData(results.data);
        
        // Initialize with all specialties unchecked (empty array)
        setSelectedSpecialties([]);
        setDataLoaded(true);
      },
    });
  }, []);

  return (
    <div className="app-container">
      <div className="main-container">
        <Header />
      </div>
      
      {/* CSV Download Link - Outside main container */}
      <div style={{ textAlign: 'center', margin: '10px 0 40px 0', position: 'absolute', justifyContent: 'center', alignItems: 'center', width: '1580px' }}>
        <a 
          href={CSV_URL} 
          download="NRMP_2020_2025_Main_and_Specialty.csv"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#003366',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 51, 102, 0.2)',
            border: 'none'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1c4176';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(0, 51, 102, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#003366';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0, 51, 102, 0.2)';
          }}
        >
          📄 Download Original CSV Data
        </a>
      </div>
      
      <div className="main-container">
        {dataLoaded && (
          <>
            <div ref={specialtyFilterRef}>
              <SpecialtyFilter 
                data={data}
                selectedSpecialties={selectedSpecialties}
                onSpecialtyChange={setSelectedSpecialties}
                showAllSelected={showAllSelectedSpecialties}
              />
            </div>
                        <NRMPTable 
            data={data}
            headers={headers}
            yearRange={yearRange}
            selectedSpecialties={selectedSpecialties}
            snhafFilter={snhafFilter}
            specialtyFilterRef={specialtyFilterRef}
            setShowAllSelectedSpecialties={setShowAllSelectedSpecialties}
            sliderComponent={
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <YearSlider
                  minYear={MIN_YEAR}
                  maxYear={MAX_YEAR}
                  value={yearRange}
                  onChange={setYearRange}
                />
                <SNHAFFilter 
                  value={snhafFilter}
                  onChange={setSnhafFilter}
                />
              </div>
            }
            />
        </>
      )}
      </div>
    </div>
  );
}
