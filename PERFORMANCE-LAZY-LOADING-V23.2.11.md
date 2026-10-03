# DOXFRAME V23.2.11 — Heavy Library Lazy Loading

## What changed
- Removed eager homepage downloads for PDF-lib, Mammoth, SheetJS, jsPDF and html2canvas.
- Kept the existing tool-level lazy loader in `public/tools/tool-app.js`; heavy conversion libraries load only when a relevant tool action starts.
- Image to Text now lazy-loads Tesseract only when OCR starts.
- Image to Text now lazy-loads jsPDF only when PDF export is requested.
- Image to Text now lazy-loads docx only when DOCX export is requested.

## Result
The homepage no longer downloads PDF/Office/conversion libraries that are not needed for initial navigation. Tool-specific dependencies remain available on demand.
