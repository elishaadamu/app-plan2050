/**
 * useRevenueData
 * Fetches /revenue_forecast.xlsx from the public folder and parses it
 * with SheetJS (xlsx) into the shape the ReportTab expects.
 *
 * Returns: { sources, rows, totals, loading, error }
 *   sources  – string[]                Revenue source names (dynamic from xlsx headers)
 *   rows     – { year, [src]: [orig, yoe, prog, util] }[]
 *   totals   – { [src]: [orig, yoe, prog, util] }
 *   loading  – boolean
 *   error    – Error | null
 */
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export function useRevenueData() {
  const [state, setState] = useState({
    sources: [],
    rows: [],
    totals: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/revenue_forecast.xlsx');
        if (!response.ok) throw new Error(`Failed to fetch xlsx: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Use the first sheet
        const sheetName = workbook.SheetNames[0];
        const ws = workbook.Sheets[sheetName];

        // Parse as array-of-arrays (row 0 = headers)
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: 0 });
        if (raw.length < 2) throw new Error('Unexpected xlsx structure');

        const headers = raw[0]; // e.g. ['Year', 'Special Structures_Original', ...]

        // Derive unique revenue source names from headers (skip 'Year' column)
        // Pattern: "<Source>_Original", "<Source>_YOE_90%_Cap", "<Source>_Programmed", "<Source>_Utilization_%"
        const sources = [];
        const seenSources = new Set();
        for (let i = 1; i < headers.length; i++) {
          const h = String(headers[i]);
          // Strip the suffix to get the base source name
          const src = h
            .replace(/_Original$/, '')
            .replace(/_YOE_90%_Cap$/, '')
            .replace(/_Programmed$/, '')
            .replace(/_Utilization_%$/, '');
          if (!seenSources.has(src)) {
            seenSources.add(src);
            sources.push(src);
          }
        }

        // Build a map: header name → column index
        const colIndex = {};
        headers.forEach((h, i) => { colIndex[String(h)] = i; });

        // Helper: get 4 values for a source from a data row
        const getVals = (rowArr, src) => {
          const orig  = rowArr[colIndex[`${src}_Original`]]     ?? 0;
          const yoe   = rowArr[colIndex[`${src}_YOE_90%_Cap`]]  ?? 0;
          const prog  = rowArr[colIndex[`${src}_Programmed`]]   ?? 0;
          const util  = rowArr[colIndex[`${src}_Utilization_%`]]?? 0;
          return [
            typeof orig  === 'number' ? orig  : 0,
            typeof yoe   === 'number' ? yoe   : 0,
            typeof prog  === 'number' ? prog  : 0,
            typeof util  === 'number' ? util  : 0,
          ];
        };

        const rows = [];
        let totals = {};

        // Data rows start at index 1
        for (let r = 1; r < raw.length; r++) {
          const rowArr = raw[r];
          const yearCell = rowArr[0];

          // Skip fully empty rows
          if (rowArr.every(c => c === 0 || c === '' || c === null || c === undefined)) continue;

          if (String(yearCell).toUpperCase() === 'TOTAL') {
            // TOTAL row → build totals map
            sources.forEach(src => { totals[src] = getVals(rowArr, src); });
          } else {
            const year = Number(yearCell);
            if (!isNaN(year) && year > 2000) {
              const rowObj = { year };
              sources.forEach(src => { rowObj[src] = getVals(rowArr, src); });
              rows.push(rowObj);
            }
          }
        }

        if (!cancelled) {
          setState({ sources, rows, totals, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: err }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
