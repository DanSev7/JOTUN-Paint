import * as XLSX from 'xlsx';

export const getStartEndForPeriod = (period) => {
  const now = new Date();
  let start;
  let end;
  switch (period) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    case 'week': {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'quarter': {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qStartMonth, 1);
      end = new Date(now.getFullYear(), qStartMonth + 3, 1);
      break;
    }
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  return { start, end };
};

export const exportToExcel = (filename, headers, rows) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

  // Define column widths (Product Name wider, includes Size)
  ws['!cols'] = [
    { wch: 20 }, // Product Name (A)
    { wch: 10 }, // Size (B)
    { wch: 10 }, // Base (C)
    { wch: 15 }, // Beginning balance
    { wch: 15 }, // Daily receiving
    { wch: 15 }, // Daily issuance
    { wch: 15 }, // Ending Balance
    { wch: 15 }, // Re-order Point
    { wch: 15 }, // Variation
    { wch: 15 }, // Economic Order Quantity
    { wch: 15 }, // Maximum Stock
    { wch: 15 }  // Quantity to be ordered
  ];

  // Style headers
  headers.forEach((_, idx) => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
    ws[cell].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: '4B5EAA' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  });

  // Style data cells with alternating column colors and red for negative Variation
  rows.forEach((row, rowIdx) => {
    headers.forEach((header, colIdx) => {
      const cell = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
      if (!ws[cell]) return;

      // Alternating column colors
      const fillColor = colIdx % 2 === 0 ? 'F5F7FA' : 'E8ECEF';

      // Apply red font for negative Variation (column index 8)
      const isNegativeVariation = header === 'Variation (pcs)' && Number(row[header]) < 0;

      ws[cell].s = {
        font: { color: { rgb: isNegativeVariation ? 'FF0000' : '000000' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: fillColor } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

export const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];