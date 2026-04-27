import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import Header from "./components/Header/Header";
import NRMPTable from "./components/NRMPTable/NRMPTable";
import YearSlider from "./components/YearSlider/YearSlider";
import SpecialtyFilter from "./components/SpecialtyFilter/SpecialtyFilter";
import SNHAFFilter from "./components/SNHAFFilter/SNHAFFilter";
import "./App.css";

const MIN_YEAR = 2020;
const MAX_YEAR = 2026;
const CSV_URL = `${import.meta.env.BASE_URL}NRMP_2020_2026_Main_and_Specialty.csv`;

export default function App() {
  const [yearRange, setYearRange] = useState([MIN_YEAR, MAX_YEAR]);
  const [data, setData] = useState([]);
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
        <Header
          csvUrl={CSV_URL}
          csvFilename="NRMP_2020_2026_Main_and_Specialty.csv"
        />

        {dataLoaded && (
          <NRMPTable
            data={data}
            yearRange={yearRange}
            selectedSpecialties={selectedSpecialties}
            snhafFilter={snhafFilter}
            specialtyFilterRef={specialtyFilterRef}
            setShowAllSelectedSpecialties={setShowAllSelectedSpecialties}
            specialtyFilterComponent={
              <div ref={specialtyFilterRef}>
                <SpecialtyFilter
                  data={data}
                  selectedSpecialties={selectedSpecialties}
                  onSpecialtyChange={setSelectedSpecialties}
                  showAllSelected={showAllSelectedSpecialties}
                />
              </div>
            }
            sliderComponent={
              <div className="dashboard-controls">
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
        )}
      </div>
    </div>
  );
}
