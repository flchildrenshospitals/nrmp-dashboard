import React, { useState, useMemo } from "react";
import "./SpecialtyFilter.css";

export default function SpecialtyFilter({ data, selectedSpecialties, onSpecialtyChange, showAllSelected = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeGroup, setActiveGroup] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

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

  const groupOptions = useMemo(() => [
    { id: "ALL", label: "All", count: uniqueSpecialties.length, specialties: uniqueSpecialties },
    { id: "MAIN", label: "Main", count: mainSpecialties.length, specialties: mainSpecialties },
    { id: "SPECIALTY", label: "Specialty", count: subspecialties.length, specialties: subspecialties },
  ], [mainSpecialties, subspecialties, uniqueSpecialties]);

  const visibleSpecialties = useMemo(() => {
    const selectedGroup = groupOptions.find(group => group.id === activeGroup) || groupOptions[0];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return selectedGroup.specialties;
    }

    return selectedGroup.specialties.filter(specialty =>
      specialty.toLowerCase().includes(normalizedSearch)
    );
  }, [activeGroup, groupOptions, searchTerm]);

  const sortedSelectedSpecialties = useMemo(
    () => [...selectedSpecialties].sort(),
    [selectedSpecialties]
  );

  const handleSelectVisible = () => {
    onSpecialtyChange([...new Set([...selectedSpecialties, ...visibleSpecialties])]);
  };

  const handleClearAll = () => {
    onSpecialtyChange([]);
  };

  const handleRemoveSpecialty = (specialty) => {
    onSpecialtyChange(selectedSpecialties.filter(s => s !== specialty));
  };

  const handleSpecialtyToggle = (specialty) => {
    if (selectedSpecialties.includes(specialty)) {
      onSpecialtyChange(selectedSpecialties.filter(s => s !== specialty));
    } else {
      onSpecialtyChange([...selectedSpecialties, specialty]);
    }
  };

  if (uniqueSpecialties.length === 0) return null;

  const selectedCount = selectedSpecialties.length;
  const allSpecialtiesSelected = selectedCount === uniqueSpecialties.length;
  const specialtySummary = selectedCount === 0 || allSpecialtiesSelected
    ? `Showing all ${uniqueSpecialties.length} specialties`
    : `${selectedCount} of ${uniqueSpecialties.length} specialties selected`;
  const visibleSelectedCount = visibleSpecialties.filter(specialty =>
    selectedSpecialties.includes(specialty)
  ).length;
  const isPdfExportView = showAllSelected;
  const allMainSelected = mainSpecialties.length > 0 &&
    mainSpecialties.every(specialty => selectedSpecialties.includes(specialty));
  const allSpecialtySelected = subspecialties.length > 0 &&
    subspecialties.every(specialty => selectedSpecialties.includes(specialty));
  const pdfSelectionTakeaways = [
    allMainSelected ? `All Main specialties selected (${mainSpecialties.length})` : null,
    allSpecialtySelected ? `All Specialty specialties selected (${subspecialties.length})` : null,
  ].filter(Boolean);
  const showExpandedContent = isExpanded || isPdfExportView;

  return (
    <div className={`specialty-filter-container ${showExpandedContent ? 'expanded' : ''} ${isPdfExportView ? 'pdf-export-view' : ''}`}>
      <div className="specialty-filter-header">
        <div>
          <p className="filter-kicker">Specialty filter</p>
          <h3>Pick specialties to include</h3>
          <p>{specialtySummary}</p>
        </div>
        <button 
          className="expand-button" 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Hide list" : "Show list"}
        </button>
      </div>
      
      <div className={`specialty-filter-content ${showExpandedContent ? 'expanded' : 'collapsed'}`}>
        {!isPdfExportView && (
          <>
            <div className="specialty-filter-toolbar">
              <label className="specialty-search-label" htmlFor="specialty-search">
                Search specialties
              </label>
              <input
                id="specialty-search"
                className="specialty-search-input"
                type="search"
                placeholder="Search by specialty name"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="specialty-group-tabs" aria-label="Specialty groups">
              {groupOptions.map(group => (
                <button
                  key={group.id}
                  className={`specialty-group-tab ${activeGroup === group.id ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                >
                  {group.label}
                  <span>{group.count}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedCount > 0 && (
          <div className="selected-specialties-panel">
            <div className="selected-specialties-header">
              <span>{selectedCount} selected</span>
              <button type="button" onClick={handleClearAll}>
                Clear all
              </button>
            </div>
            {isPdfExportView && pdfSelectionTakeaways.length > 0 && (
              <div className="pdf-selection-takeaways">
                {pdfSelectionTakeaways.map(takeaway => (
                  <span key={takeaway}>{takeaway}</span>
                ))}
              </div>
            )}
            <div className="selected-specialty-chips">
              {(showAllSelected ? sortedSelectedSpecialties : sortedSelectedSpecialties.slice(0, 8)).map(specialty => (
                <button
                  type="button"
                  className="selected-specialty-chip"
                  key={specialty}
                  onClick={() => handleRemoveSpecialty(specialty)}
                  aria-label={`Remove ${specialty}`}
                >
                  {specialty}
                  <span aria-hidden="true">x</span>
                </button>
              ))}
              {!showAllSelected && selectedCount > 8 && (
                <span className="selected-specialty-more">
                  +{selectedCount - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {!isPdfExportView && (
          <>
            <div className="specialty-list-header">
              <p>
                Showing {visibleSpecialties.length} {visibleSpecialties.length === 1 ? "specialty" : "specialties"}
                {searchTerm.trim() ? ` matching "${searchTerm.trim()}"` : ""}
              </p>
              <div className="specialty-list-actions">
                <button
                  type="button"
                  onClick={handleSelectVisible}
                  disabled={visibleSpecialties.length === 0 || visibleSelectedCount === visibleSpecialties.length}
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={selectedCount === 0}
                >
                  Clear all
                </button>
              </div>
          </div>

            <div className="specialties-grid">
              {visibleSpecialties.length === 0 ? (
                <div className="no-specialty-results">
                  No specialties match your search.
                </div>
              ) : (
                visibleSpecialties.map(specialty => (
                  <label
                    key={specialty}
                    className={`checkbox-label specialty-option ${selectedSpecialties.includes(specialty) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                    />
                    <span>{specialty}</span>
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>
      
      {!showExpandedContent && selectedSpecialties.length > 0 && selectedSpecialties.length < uniqueSpecialties.length && (
        <div className="filter-summary">
          <span className="filter-summary-label">{selectedCount} selected:</span>
          <div className="selected-specialty-chips">
            {(showAllSelected ? sortedSelectedSpecialties : sortedSelectedSpecialties.slice(0, 5)).map(specialty => (
              <button
                type="button"
                className="selected-specialty-chip"
                key={specialty}
                onClick={() => handleRemoveSpecialty(specialty)}
                aria-label={`Remove ${specialty}`}
              >
                {specialty}
                <span aria-hidden="true">x</span>
              </button>
            ))}
            {!showAllSelected && selectedCount > 5 && (
              <span className="selected-specialty-more">
                +{selectedCount - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 