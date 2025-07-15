import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './PDFExport.css';

const PDFExport = ({ tableRef, filterRef, specialtyFilterRef, filename = 'nrmp-summary-report' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!tableRef.current) {
      console.error('Table reference not found');
      return;
    }

    setIsExporting(true);
    
    try {
      // First, capture the specialty filter section if available
      let specialtyFilterCanvas = null;
      if (specialtyFilterRef && specialtyFilterRef.current) {
        specialtyFilterCanvas = await html2canvas(specialtyFilterRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: specialtyFilterRef.current.scrollWidth,
          height: specialtyFilterRef.current.scrollHeight,
        });
      }

      // Then, capture the slider filter section if available
      let filterCanvas = null;
      if (filterRef && filterRef.current) {
        filterCanvas = await html2canvas(filterRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: filterRef.current.scrollWidth,
          height: filterRef.current.scrollHeight,
        });
      }

      // Then, capture the table header
      const tableHeader = tableRef.current.querySelector('thead');
      const headerCanvas = await html2canvas(tableHeader, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tableHeader.scrollWidth,
        height: tableHeader.scrollHeight,
      });

      // Then capture the table body
      const tableBody = tableRef.current.querySelector('tbody');
      const bodyCanvas = await html2canvas(tableBody, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tableBody.scrollWidth,
        height: tableBody.scrollHeight,
      });

      // Calculate row heights for smart page breaks
      const tableRows = tableBody.querySelectorAll('tr');
      const rowHeights = Array.from(tableRows).map(row => row.offsetHeight);
      const totalRows = rowHeights.length;

      // Calculate PDF dimensions
      const headerImgData = headerCanvas.toDataURL('image/png');
      const bodyImgData = bodyCanvas.toDataURL('image/png');
      const filterImgData = filterCanvas ? filterCanvas.toDataURL('image/png') : null;
      const specialtyFilterImgData = specialtyFilterCanvas ? specialtyFilterCanvas.toDataURL('image/png') : null;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 portrait dimensions in mm
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit the page width
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const headerImgHeight = (headerCanvas.height * imgWidth) / headerCanvas.width;
      const bodyImgHeight = (bodyCanvas.height * imgWidth) / bodyCanvas.width;
      const filterImgHeight = filterCanvas ? (filterCanvas.height * imgWidth) / filterCanvas.width : 0;
      const specialtyFilterImgHeight = specialtyFilterCanvas ? (specialtyFilterCanvas.height * imgWidth) / specialtyFilterCanvas.width : 0;

      // Document header height reservation (title + date)
      const docHeaderHeight = 40;
      // Available height for table content (accounting for doc header + specialty filter + slider filters + table header)
      const availableHeight = pdfHeight - docHeaderHeight - specialtyFilterImgHeight - filterImgHeight - headerImgHeight - 10; // 10mm bottom margin

      // Add title and date to first page
      const addHeader = (pageNum = 1) => {
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('National Residency Match Program (NRMP) Data Export', 10, 15);
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const currentDate = new Date().toLocaleDateString();
        pdf.text(`Generated on: ${currentDate}`, 10, 25);
        
        if (pageNum > 1) {
          pdf.text(`Page ${pageNum}`, pdfWidth - 30, 25);
        }
      };

      // Add header to first page
      addHeader(1);

      // Add filter sections to first page if available
      let currentY = docHeaderHeight;
      
      // Add specialty filter first
      if (specialtyFilterImgData) {
        pdf.addImage(specialtyFilterImgData, 'PNG', 10, currentY, imgWidth, specialtyFilterImgHeight);
        currentY += specialtyFilterImgHeight + 5; // 5mm gap after specialty filter
      }
      
      // Add slider filters below specialty filter
      if (filterImgData) {
        pdf.addImage(filterImgData, 'PNG', 10, currentY, imgWidth, filterImgHeight);
        currentY += filterImgHeight + 5; // 5mm gap after slider filters
      }

      // Check if we need multiple pages
      if (bodyImgHeight <= availableHeight) {
        // Single page - fits entirely
        // Add table header
        pdf.addImage(headerImgData, 'PNG', 10, currentY, imgWidth, headerImgHeight);
        // Add table body below header
        pdf.addImage(bodyImgData, 'PNG', 10, currentY + headerImgHeight, imgWidth, bodyImgHeight);
      } else {
        // Multiple pages needed - split at row boundaries
        const availableHeightPx = (availableHeight * bodyCanvas.height) / bodyImgHeight;
        const scaleFactor = bodyCanvas.height / tableBody.scrollHeight;
        
        let currentRow = 0;
        let pageNumber = 1;
        
        while (currentRow < totalRows) {
          if (pageNumber > 1) {
            pdf.addPage();
            addHeader(pageNumber);
          }
          
          // Calculate Y position for table header (filters only on first page)
          let tableHeaderY = docHeaderHeight;
          if (pageNumber === 1 && (specialtyFilterImgData || filterImgData)) {
            tableHeaderY = currentY; // Use currentY which includes filter sections
          }
          
          // Add table header to each page
          pdf.addImage(headerImgData, 'PNG', 10, tableHeaderY, imgWidth, headerImgHeight);
          
          // Calculate available height for this page (different for first page with filters)
          let pageAvailableHeightPx = availableHeightPx;
          if (pageNumber === 1 && (specialtyFilterImgData || filterImgData)) {
            // First page has less space due to filter sections
            pageAvailableHeightPx = availableHeightPx;
          } else if (pageNumber > 1) {
            // Subsequent pages have more space (no filter sections)
            const subsequentAvailableHeight = pdfHeight - docHeaderHeight - headerImgHeight - 10;
            pageAvailableHeightPx = (subsequentAvailableHeight * bodyCanvas.height) / bodyImgHeight;
          }
          
          // Calculate how many rows can fit on this page
          let rowsOnPage = 0;
          let accumulatedHeight = 0;
          
          for (let i = currentRow; i < totalRows; i++) {
            const rowHeightPx = rowHeights[i] * scaleFactor;
            if (accumulatedHeight + rowHeightPx <= pageAvailableHeightPx) {
              accumulatedHeight += rowHeightPx;
              rowsOnPage++;
            } else {
              break;
            }
          }
          
          // If no rows fit, force at least one row to prevent infinite loop
          if (rowsOnPage === 0) {
            rowsOnPage = 1;
            accumulatedHeight = rowHeights[currentRow] * scaleFactor;
          }
          
          // Calculate the exact pixel range for these rows
          const startY = rowHeights.slice(0, currentRow).reduce((sum, height) => sum + height, 0) * scaleFactor;
          const endY = startY + accumulatedHeight;
          
          // Create a temporary canvas for this page's content
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = bodyCanvas.width;
          pageCanvas.height = accumulatedHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          // Draw the exact rows for this page
          pageCtx.drawImage(
            bodyCanvas,
            0, startY, bodyCanvas.width, accumulatedHeight,
            0, 0, bodyCanvas.width, accumulatedHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = (accumulatedHeight * imgWidth) / bodyCanvas.width;
          
          // Add body content below the header
          pdf.addImage(pageImgData, 'PNG', 10, tableHeaderY + headerImgHeight, imgWidth, pageImgHeight);
          
          currentRow += rowsOnPage;
          pageNumber++;
        }
      }

      // Save the PDF
      pdf.save(`${filename}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className="pdf-export-btn"
      onClick={exportToPDF}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <span className="export-spinner"></span>
          Exporting...
        </>
      ) : (
        <>
          <span className="export-icon">📄</span>
          Export to PDF
        </>
      )}
    </button>
  );
};

export default PDFExport; 