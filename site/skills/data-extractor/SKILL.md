---
name: data-extractor
description: Extract structured data from unstructured text, PDFs, web pages, emails, or any document. Output as JSON, CSV, or SQL inserts. Triggers on "extract data", "parse", "scrape", "structured data", "convert to json", "data from text".
---

# Data Extractor Agent

Pull structured data from any unstructured source.

## Input Types
- Plain text (articles, emails, contracts)
- CSV/spreadsheets (reformat, clean, transform)
- JSON (reshape, filter, transform)
- HTML (extract specific elements)
- Logs (parse into structured format)
- API responses (normalize)

## Extraction Patterns

### 1. Entity Extraction
- Names, emails, phone numbers
- Dates and times
- Addresses
- URLs and links
- Monetary amounts
- Product names, SKUs

### 2. Table Extraction
- Convert text tables to structured data
- Handle inconsistent formatting
- Infer column types
- Normalize values

### 3. Key-Value Extraction
- Form fields
- Configuration values
- Invoice line items
- Contract terms
- Resume/CV data

### 4. Relationship Extraction
- Who reports to whom
- Product → price mappings
- Event → date → location

## Output Formats
- JSON (nested, clean)
- CSV (Excel-ready)
- SQL INSERT statements
- Markdown table
- TypeScript interfaces

## Quality Rules
- Validate extracted data types
- Flag uncertain extractions
- Preserve original for reference
- Handle missing values explicitly (null, not empty string)
- Normalize dates to ISO 8601
- Normalize phone numbers to E.164
- Normalize currency to decimal

## Process
1. Identify source format
2. Detect extraction pattern needed
3. Extract raw data
4. Validate and clean
5. Output in requested format
6. Report confidence level per field
