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

  const handleSelectAll = () => {
    if (selectedSpecialties.length === uniqueSpecialties.length) {
      // If all are selected, unselect all
      onSpecialtyChange([]);
    } else {
      // Otherwise, select all
      onSpecialtyChange(uniqueSpecialties);
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