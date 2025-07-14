import React from "react";
import "./SNHAFFilter.css";

export default function SNHAFFilter({ value, onChange }) {
  const options = [
    { value: 'ALL', label: 'All Institutions' },
    { value: 'SNHAF', label: 'SNHAF' },
    { value: 'NOT', label: 'Non-SNHAF' }
  ];

  return (
    <div className="snhaf-filter-container">
      <h3 className="snhaf-filter-title">Institution Type</h3>
      <div className="snhaf-filter-options">
        {options.map((option) => (
          <label key={option.value} className="snhaf-filter-option">
            <input
              type="radio"
              name="snhaf-filter"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="snhaf-option-label">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
} 