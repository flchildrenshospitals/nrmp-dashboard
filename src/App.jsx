import { useState, useEffect } from "react";
import Papa from "papaparse";
import Header from "./components/Header/Header";
import NRMPTable from "./components/NRMPTable/NRMPTable";
import YearSlider from "./components/YearSlider/YearSlider";
import SpecialtyFilter from "./components/SpecialtyFilter/SpecialtyFilter";

// Update as appropriate based on your CSV
const MIN_YEAR = 2020;
const MAX_YEAR = 2025;
const CSV_URL = `${import.meta.env.BASE_URL}NRMP_2020_2025_Main_and_Specialty.csv`;

export default function App() {
  const [yearRange, setYearRange] = useState([MIN_YEAR, MAX_YEAR]);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

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
        {dataLoaded && (
          <>
            <SpecialtyFilter 
              data={data}
              selectedSpecialties={selectedSpecialties}
              onSpecialtyChange={setSelectedSpecialties}
            />
            <NRMPTable 
            data={data}
            headers={headers}
            yearRange={yearRange}
            selectedSpecialties={selectedSpecialties}
            sliderComponent={
              <YearSlider
                minYear={MIN_YEAR}
                maxYear={MAX_YEAR}
                value={yearRange}
                onChange={setYearRange}
              />
            }
          />
        </>
      )}
      </div>
    </div>
  );
}
