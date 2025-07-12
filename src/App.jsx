import { useState } from "react";
import Header from "./components/Header/Header";
import NRMPTable from "./components/NRMPTable/NRMPTable";
import YearSlider from "./components/YearSlider/YearSlider";

// Update as appropriate based on your CSV
const MIN_YEAR = 2020;
const MAX_YEAR = 2025;

export default function App() {
  const [yearRange, setYearRange] = useState([MIN_YEAR, MAX_YEAR]);

  return (
    <div className="app-container">
      <NRMPTable 
        yearRange={yearRange}
        headerComponent={<Header />}
        sliderComponent={
          <YearSlider
            minYear={MIN_YEAR}
            maxYear={MAX_YEAR}
            value={yearRange}
            onChange={setYearRange}
          />
        }
      />
    </div>
  );
}
