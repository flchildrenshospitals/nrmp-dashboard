import { useEffect, useRef } from "react";

export default function YearSlider({ minYear, maxYear, value, onChange }) {
  const sliderRef = useRef(null);
  const sliderInstance = useRef(null);
  const isUpdating = useRef(false);

  useEffect(() => {
    // Load noUiSlider CSS if not already loaded
    if (!document.querySelector('link[href*="nouislider"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.6.1/nouislider.min.css';
      document.head.appendChild(link);
    }

    // Add custom CSS for blue color theme
    if (!document.querySelector('#nouislider-custom-styles')) {
      const style = document.createElement('style');
      style.id = 'nouislider-custom-styles';
      style.textContent = `
        .noUi-connect {
          background-color: #003366 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Load noUiSlider JS if not already loaded
    if (!window.noUiSlider) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.6.1/nouislider.min.js';
      script.onload = initializeSlider;
      document.head.appendChild(script);
    } else {
      initializeSlider();
    }

    function initializeSlider() {
      if (sliderRef.current && window.noUiSlider && !sliderInstance.current) {
        // Create new slider
        window.noUiSlider.create(sliderRef.current, {
          start: [value[0], value[1]],
          connect: true,
          range: {
            min: minYear,
            max: maxYear,
          },
          step: 1,
          tooltips: true,
          format: {
            to: (value) => Math.round(value),
            from: (value) => Math.round(value),
          },
        });

        sliderInstance.current = sliderRef.current.noUiSlider;

        // Listen for updates
        sliderInstance.current.on('update', function (values, handle) {
          if (!isUpdating.current) {
            const newRange = values.map((v) => parseInt(v, 10));
            onChange(newRange);
          }
        });
      }
    }

    // Cleanup function
    return () => {
      if (sliderInstance.current) {
        sliderInstance.current.destroy();
        sliderInstance.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update slider when value prop changes
  useEffect(() => {
    if (sliderInstance.current && !isUpdating.current) {
      isUpdating.current = true;
      try {
        sliderInstance.current.set([value[0], value[1]]);
      } catch (error) {
        console.warn('Error updating slider:', error);
      }
      setTimeout(() => {
        isUpdating.current = false;
      }, 10);
    }
  }, [value]);

  return (
    <div style={{ 
      maxWidth: 500, 
      margin: "68px auto 0px auto", 
      padding: "0 20px" 
    }}>
      <div 
        ref={sliderRef} 
        style={{ marginBottom: "0px" }}
      ></div>
      <div style={{ 
        textAlign: "center", 
        marginTop: 8, 
        fontWeight: "bold",
        fontSize: "14px"
      }}>
        <strong>Years:</strong> {value[0]} – {value[1]}
      </div>
    </div>
  );
}
