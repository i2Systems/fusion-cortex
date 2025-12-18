# PyMuPDF Setup Instructions

To enable server-side PDF vector extraction with PyMuPDF (fitz), you need to install the Python library.

## Installation

```bash
pip install PyMuPDF
```

Or using the requirements file:

```bash
pip install -r requirements.txt
```

## Verify Installation

```bash
python3 -c "import fitz; print('PyMuPDF version:', fitz.version)"
```

## How It Works

1. Client uploads PDF to `/api/pdf/extract-vectors`
2. Server saves PDF temporarily
3. Python script uses PyMuPDF to extract SVG/vector data
4. Server returns JSON with paths, text, and bounds
5. Client uses this data for vector rendering

## Benefits

- **Accurate extraction**: PyMuPDF can access Form XObjects (nested content)
- **SVG support**: Converts PDF to SVG which preserves all vector elements
- **Better text extraction**: More accurate text positioning
- **All paths captured**: Unlike PDF.js, PyMuPDF can extract paths from Form XObjects

## Fallback

If PyMuPDF is not installed, the system automatically falls back to browser-based PDF.js extraction.

