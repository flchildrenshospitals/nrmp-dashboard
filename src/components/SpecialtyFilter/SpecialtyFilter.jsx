import React, { useState, useMemo } from "react";
import "./SpecialtyFilter.css";

export default function SpecialtyFilter({ data, selectedSpecialties, onSpecialtyChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique specialties from data
  const uniqueSpecialties = useMemo(() => {
    const specialties = new Set();
    data.forEach(row => {
      if (row["Specialty Cleaned"] && row["Specialty Cleaned"].trim() !== "") {
        specialties.add(row["Specialty Cleaned"]);
      }
    });
    return Array.from(specialties).sort();
  }, [data]);

  // Extract main and specialty categories
  const mainSpecialties = useMemo(() => {
    const specialties = new Set();
    data.forEach(row => {
      if (row["Table"] === "Main" && row["Specialty Cleaned"] && row["Specialty Cleaned"].trim() !== "") {
        specialties.add(row["Specialty Cleaned"]);
      }
    });
    return Array.from(specialties).sort();
  }, [data]);

  const subspecialties = useMemo(() => {
    const specialties = new Set();
    data.forEach(row => {
      if (row["Table"] === "Specialty" && row["Specialty Cleaned"] && row["Specialty Cleaned"].trim() !== "") {
        specialties.add(row["Specialty Cleaned"]);
      }
    });
    return Array.from(specialties).sort();
  }, [data]);

  const handleSelectAll = () => {
    if (selectedSpecialties.length === uniqueSpecialties.length) {
      // If all are selected, unselect all
      onSpecialtyChange([]);
    } else {
      // Otherwise, select all
      onSpecialtyChange(uniqueSpecialties);
    }
  };

  const handleSelectAllMain = () => {
    // Toggle all main specialties
    const allMainSelected = mainSpecialties.every(specialty => selectedSpecialties.includes(specialty));
    if (allMainSelected) {
      // Remove all main specialties from selection
      onSpecialtyChange(selectedSpecialties.filter(specialty => !mainSpecialties.includes(specialty)));
    } else {
      // Add all main specialties to selection (avoiding duplicates)
      const newSelection = [...new Set([...selectedSpecialties, ...mainSpecialties])];
      onSpecialtyChange(newSelection);
    }
  };

  const handleSelectAllSpecialty = () => {
    // Toggle all subspecialties
    const allSubspecialtiesSelected = subspecialties.every(specialty => selectedSpecialties.includes(specialty));
    if (allSubspecialtiesSelected) {
      // Remove all subspecialties from selection
      onSpecialtyChange(selectedSpecialties.filter(specialty => !subspecialties.includes(specialty)));
    } else {
      // Add all subspecialties to selection (avoiding duplicates)
      const newSelection = [...new Set([...selectedSpecialties, ...subspecialties])];
      onSpecialtyChange(newSelection);
    }
  };

  const handleSpecialtyToggle = (specialty) => {
    if (selectedSpecialties.includes(specialty)) {
      onSpecialtyChange(selectedSpecialties.filter(s => s !== specialty));
    } else {
      onSpecialtyChange([...selectedSpecialties, specialty]);
    }
  };

  if (uniqueSpecialties.length === 0) return null;

  return (
    <div className={`specialty-filter-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="specialty-filter-header">
        <h3>Filter by Specialty</h3>
        <button 
          className="expand-button" 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>
      
      <div className={`specialty-filter-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="select-all-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedSpecialties.length === uniqueSpecialties.length}
              onChange={handleSelectAll}
            />
            <span>Select All ({uniqueSpecialties.length})</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={mainSpecialties.every(specialty => selectedSpecialties.includes(specialty)) && mainSpecialties.length > 0}
              onChange={handleSelectAllMain}
            />
            <span>All Main ({mainSpecialties.length})</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={subspecialties.every(specialty => selectedSpecialties.includes(specialty)) && subspecialties.length > 0}
              onChange={handleSelectAllSpecialty}
            />
            <span>All Specialty ({subspecialties.length})</span>
          </label>
        </div>
        
        <div className="specialties-grid">
          {uniqueSpecialties.map(specialty => (
            <label key={specialty} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSpecialties.includes(specialty)}
                onChange={() => handleSpecialtyToggle(specialty)}
              />
              <span>{specialty}</span>
            </label>
          ))}
        </div>
      </div>
      
      {!isExpanded && selectedSpecialties.length > 0 && selectedSpecialties.length < uniqueSpecialties.length && (
        <div className="filter-summary">
          {(() => {
            const maxDisplay = 3; // Maximum number of specialties to show
            const sortedSpecialties = [...selectedSpecialties].sort();
            const displaySpecialties = sortedSpecialties.slice(0, maxDisplay);
            const remaining = selectedSpecialties.length - maxDisplay;
            
            let text = displaySpecialties.join(", ");
            if (remaining > 0) {
              text += ` and ${remaining} more`;
            }
            
            return text;
          })()}
        </div>
      )}
    </div>
  );
} 