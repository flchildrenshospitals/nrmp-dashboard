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
      // Create canvas from the table
      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tableRef.current.scrollWidth,
        height: tableRef.current.scrollHeight,
      });

      // Calculate PDF dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // A4 landscape dimensions in mm
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit the page
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('NRMP Summary Report', 10, 15);
      
      // Add current date
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, 10, 25);

      // Add the table image
      const yPosition = 35;
      
      if (imgHeight > pdfHeight - yPosition - 10) {
        // If image is too tall, we might need to scale it down further
        const scaleFactor = (pdfHeight - yPosition - 10) / imgHeight;
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;
        pdf.addImage(imgData, 'PNG', 10, yPosition, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
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