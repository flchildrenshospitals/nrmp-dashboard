import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './PDFExport.css';

const PDFExport = ({ tableRef, filename = 'nrmp-summary-report' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!tableRef.current) {
      console.error('Table reference not found');
      return;
    }

    setIsExporting(true);
    
    try {
      // First, capture the table header
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

      // Document header height reservation (title + date)
      const docHeaderHeight = 40;
      // Available height for table content (accounting for doc header + table header)
      const availableHeight = pdfHeight - docHeaderHeight - headerImgHeight - 10; // 10mm bottom margin

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

      // Check if we need multiple pages
      if (bodyImgHeight <= availableHeight) {
        // Single page - fits entirely
        // Add table header
        pdf.addImage(headerImgData, 'PNG', 10, docHeaderHeight, imgWidth, headerImgHeight);
        // Add table body below header
        pdf.addImage(bodyImgData, 'PNG', 10, docHeaderHeight + headerImgHeight, imgWidth, bodyImgHeight);
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
          
          // Add table header to each page
          pdf.addImage(headerImgData, 'PNG', 10, docHeaderHeight, imgWidth, headerImgHeight);
          
          // Calculate how many rows can fit on this page
          let rowsOnPage = 0;
          let accumulatedHeight = 0;
          
          for (let i = currentRow; i < totalRows; i++) {
            const rowHeightPx = rowHeights[i] * scaleFactor;
            if (accumulatedHeight + rowHeightPx <= availableHeightPx) {
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
          pdf.addImage(pageImgData, 'PNG', 10, docHeaderHeight + headerImgHeight, imgWidth, pageImgHeight);
          
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