import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, X, Loader2, ArrowRight } from 'lucide-react';

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [workbookRef, setWorkbookRef] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Helper to normalize strings for robust matching
  const cleanStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const parseNumber = (val) => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    if (!s || /^(n\/?a|none|-|null)$/i.test(s)) return null;
    const clean = s.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  const getCellText = (row, indices) => {
    for (const idx of indices) {
      const v = row[idx];
      if (v !== undefined && v !== null && String(v).trim().length > 0) {
        return String(v).trim();
      }
    }
    return '';
  };

  const getCellNum = (row, indices) => {
    for (const idx of indices) {
      const v = row[idx];
      const n = parseNumber(v);
      if (n !== null) return n;
    }
    return null;
  };

  const parseSheetData = (worksheet) => {
    const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!allRows || allRows.length === 0) {
      throw new Error('This worksheet contains no data rows.');
    }

    // 1. Detect Header Row: Scan first 30 rows for 'item name', 'item', 'product', or 'supplier'
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(30, allRows.length); i++) {
      const row = allRows[i];
      if (row.some(c => typeof c === 'string' && /item\s*name|product\s*name|^item$|^product$|^products$|supplier/i.test(c.trim()))) {
        headerRowIdx = i;
        break;
      }
    }

    // Fallback: search for any row with multiple non-empty strings
    if (headerRowIdx === -1) {
      headerRowIdx = allRows.findIndex(r => r.filter(c => typeof c === 'string' && c.trim().length > 0).length >= 2);
      if (headerRowIdx === -1) headerRowIdx = 0;
    }

    const headerRow = allRows[headerRowIdx];

    // 2. Map Column Indices
    const colIndices = {
      above10: [],
      wholesale: [],
      origPrice: [],
      sellPrice: [],
      supplier: [],
      name: []
    };

    headerRow.forEach((cell, idx) => {
      const c = cleanStr(cell);
      if (!c) return;

      // Note: check above10 before name, because 'above10items' contains 'item'
      if (/above10|10items|10plus|priceabove10|bulk10/.test(c)) {
        colIndices.above10.push(idx);
      } else if (/wholesale|wsprice|bulkprice/.test(c)) {
        colIndices.wholesale.push(idx);
      } else if (/originalprice|costprice|^cost$|origprice|capital|puhunan|buyingprice/.test(c)) {
        colIndices.origPrice.push(idx);
      } else if (/sellingprice|retailprice|^price$|sellprice/.test(c) && !/discount|markup/.test(c)) {
        colIndices.sellPrice.push(idx);
      } else if (/supplier|vendor|distributor|source/.test(c)) {
        colIndices.supplier.push(idx);
      } else if (/itemname|productname|^item$|^product$|description/.test(c) && !/discount|markup/.test(c)) {
        colIndices.name.push(idx);
      }
    });

    // If no explicit selling price column matched, check if any column has 'price' or 'srp'
    if (colIndices.sellPrice.length === 0) {
      headerRow.forEach((cell, idx) => {
        const c = cleanStr(cell);
        if (/price|srp/.test(c) && !colIndices.origPrice.includes(idx) && !colIndices.above10.includes(idx) && !colIndices.wholesale.includes(idx)) {
          colIndices.sellPrice.push(idx);
        }
      });
    }

    // 3. Process each data row
    const processed = [];
    let consecutiveEmpty = 0;
    for (let r = headerRowIdx + 1; r < allRows.length; r++) {
      const row = allRows[r];
      if (!row || row.length === 0) {
        consecutiveEmpty++;
        if (consecutiveEmpty > 50) break;
        continue;
      }

      const name = getCellText(row, colIndices.name);
      // Skip empty rows or summary/totals
      if (!name) {
        consecutiveEmpty++;
        if (consecutiveEmpty > 50) break;
        continue;
      }
      consecutiveEmpty = 0;

      if (/^(total|grand total|subtotal|summary)$/i.test(name)) {
        continue;
      }

      const supplier = getCellText(row, colIndices.supplier) || null;
      const originalPrice = getCellNum(row, colIndices.origPrice);
      let price = getCellNum(row, colIndices.sellPrice);
      const priceAbove10 = getCellNum(row, colIndices.above10);
      const wholesalePrice = getCellNum(row, colIndices.wholesale);

      // Default price if not specified
      if (price === null) {
        if (priceAbove10 !== null) price = priceAbove10;
        else if (originalPrice !== null) price = originalPrice;
        else price = 0;
      }

      const isValid = Boolean(name && price !== null && price >= 0);

      processed.push({
        rowIndex: r + 1,
        name,
        supplier,
        originalPrice,
        price,
        priceAbove10,
        wholesalePrice,
        isValid
      });
    }

    return processed;
  };

  const handleFileProcess = (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setParseError('');
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        setWorkbookRef(workbook);
        setSheetNames(workbook.SheetNames);

        // Find the best sheet:
        // Priority 1: Sheet containing 'data', 'item', 'product', 'inventory', 'source', 'price'
        let targetSheetName = workbook.SheetNames.find(s => 
          /data|source|item|product|inventory|price|master|list/i.test(s)
        );

        // Priority 2: Scan sheets to find the one with actual product headers or most rows
        if (!targetSheetName) {
          let maxRows = 0;
          for (const sName of workbook.SheetNames) {
            const s = workbook.Sheets[sName];
            const rows = XLSX.utils.sheet_to_json(s, { header: 1 });
            if (rows && rows.length > maxRows) {
              maxRows = rows.length;
              targetSheetName = sName;
            }
          }
        }

        if (!targetSheetName) {
          targetSheetName = workbook.SheetNames[0];
        }

        setSelectedSheet(targetSheetName);
        const items = parseSheetData(workbook.Sheets[targetSheetName]);
        if (items.length === 0) {
          setParseError(`Sheet "${targetSheetName}" contained no readable products. Please check the sheet contents.`);
        }
        setParsedRows(items);
      } catch (err) {
        console.error('Excel parse error:', err);
        setParseError(err.message || 'Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.');
        setParsedRows([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setParseError('Failed to read the file.');
      setIsParsing(false);
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleSheetChange = (sheetName) => {
    setSelectedSheet(sheetName);
    if (!workbookRef || !workbookRef.Sheets[sheetName]) return;
    try {
      setParseError('');
      const items = parseSheetData(workbookRef.Sheets[sheetName]);
      setParsedRows(items);
      if (items.length === 0) {
        setParseError(`Sheet "${sheetName}" contains 0 readable product rows.`);
      }
    } catch (err) {
      setParseError(err.message || `Error reading sheet "${sheetName}".`);
      setParsedRows([]);
    }
  };

  const handleDownloadTemplate = () => {
    // Exact 6 fields requested by user: Item Name, Supplier, Original Price, Selling Price, Above 10 items, Whole Sale Price
    const templateData = [
      {
        'Item Name': 'Lucky Me! Pancit Canton Kalamansi 80g',
        'Supplier': 'Monde Nissin Corp',
        'Original Price': 13.50,
        'Selling Price': 16.00,
        'Above 10 items': 15.00,
        'Whole Sale Price': 14.00
      },
      {
        'Item Name': 'Century Tuna Flakes in Oil 155g',
        'Supplier': 'Century Pacific Food',
        'Original Price': 32.00,
        'Selling Price': 38.50,
        'Above 10 items': 36.50,
        'Whole Sale Price': 35.00
      },
      {
        'Item Name': 'Coca-Cola 1.5L PET',
        'Supplier': 'Coca-Cola Beverages PH',
        'Original Price': 62.00,
        'Selling Price': 75.00,
        'Above 10 items': 70.00,
        'Whole Sale Price': 68.00
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 38 }, // Item Name
      { wch: 24 }, // Supplier
      { wch: 15 }, // Original Price
      { wch: 15 }, // Selling Price
      { wch: 16 }, // Above 10 items
      { wch: 16 }  // Whole Sale Price
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Source');
    XLSX.writeFile(workbook, 'chino_inventory_template.xlsx');
  };

  const handleConfirmImport = async () => {
    const validItems = parsedRows.filter(r => r.isValid);
    if (validItems.length === 0) {
      setParseError('No valid items found to import.');
      return;
    }

    setIsSubmitting(true);
    setParseError('');

    try {
      const payload = validItems.map(item => ({
        name: item.name,
        supplier: item.supplier,
        originalPrice: item.originalPrice,
        price: item.price,
        priceAbove10: item.priceAbove10,
        wholesalePrice: item.wholesalePrice,
        category: 'General',
        stock: 0,
        unit: 'pc',
        barcode: null,
        description: null
      }));

      await onImportSuccess(payload);
      handleReset();
      onClose();
    } catch (err) {
      setParseError(err.message || 'Failed to import products to inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setWorkbookRef(null);
    setSheetNames([]);
    setSelectedSheet('');
    setParsedRows([]);
    setParseError('');
    setIsParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '860px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: '#ecfdf5', 
              color: '#059669', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>
                Import Items from Excel
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Bulk import products with Item Name, Supplier, Original Price, Selling Price, Above 10 Qty, and Wholesale Price
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: '#64748b', fontSize: '1.3rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem' }}>
          {parseError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              {parseError}
            </div>
          )}

          {/* Action Row: Template Download & Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                Download standard Excel template (.xlsx)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Columns: Item Name, Supplier, Original Price, Selling Price, Above 10 items, Whole Sale Price.
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleDownloadTemplate}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={15} />
              <span>Download Template</span>
            </button>
          </div>

          {/* Dropzone or Parsed Summary */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileProcess(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#2563eb' : '#cbd5e1'}`,
                background: isDragging ? '#eff6ff' : '#f8fafc',
                borderRadius: '12px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#e0e7ff',
                color: '#3b82f6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem'
              }}>
                <Upload size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                Click to browse or drag and drop your Excel file here
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Supports standard Microsoft Excel spreadsheets (.xlsx, .xls) and CSV (.csv)
              </p>
            </div>
          ) : (
            <div>
              {/* File details & Sheet selector banner */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileSpreadsheet size={18} color="#059669" />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{file.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>

                {/* Sheet Selector (if multiple sheets exist) */}
                {sheetNames.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Sheet:</span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="form-input"
                      style={{ padding: '2px 8px', fontSize: '0.8rem', width: 'auto' }}
                    >
                      {sheetNames.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: '#dcfce7',
                    color: '#15803d'
                  }}>
                    ✓ {validCount} items ready to import
                  </span>

                  {invalidCount > 0 && (
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: '#fee2e2',
                      color: '#b91c1c'
                    }}>
                      ⚠ {invalidCount} skipped
                    </span>
                  )}

                  <button
                    onClick={handleReset}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Data Preview Table: Exactly 7 columns: #, Item Name, Supplier, Orig. Price, Selling Price, Above 10, Wholesale */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                maxHeight: '380px',
                overflow: 'auto',
                background: '#ffffff'
              }}>
                <table className="data-table" style={{ fontSize: '0.825rem', width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      <th style={{ width: '45px' }}>#</th>
                      <th>Item Name</th>
                      <th>Supplier</th>
                      <th style={{ width: '120px' }}>Orig. Price (₱)</th>
                      <th style={{ width: '130px' }}>Selling Price (₱)</th>
                      <th style={{ width: '120px' }}>Above 10 (₱)</th>
                      <th style={{ width: '130px' }}>Whole Sale Price (₱)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} style={{ background: row.isValid ? undefined : '#fff5f5' }}>
                        <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: row.name ? '#0f172a' : '#ef4444' }}>
                          {row.name || '(Missing Name)'}
                        </td>
                        <td style={{ color: row.supplier ? '#334155' : '#94a3b8' }}>
                          {row.supplier || '—'}
                        </td>
                        <td style={{ color: row.originalPrice != null ? '#475569' : '#94a3b8' }}>
                          {row.originalPrice != null ? `₱${Number(row.originalPrice).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#047857' }}>
                          ₱{Number(row.price).toFixed(2)}
                        </td>
                        <td style={{ color: row.priceAbove10 != null ? '#2563eb' : '#94a3b8', fontWeight: row.priceAbove10 != null ? 600 : 400 }}>
                          {row.priceAbove10 != null ? `₱${Number(row.priceAbove10).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ color: row.wholesalePrice != null ? '#7c3aed' : '#94a3b8', fontWeight: row.wholesalePrice != null ? 600 : 400 }}>
                          {row.wholesalePrice != null ? `₱${Number(row.wholesalePrice).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.25rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirmImport}
            disabled={!file || validCount === 0 || isSubmitting || isParsing}
            style={{ minWidth: '170px', justifyContent: 'center' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <ArrowRight size={16} />
                <span>Import {validCount > 0 ? `${validCount} Products` : 'Products'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
