# Shared helpers for parsing uploaded .xlsx files for bulk-import endpoints.
import openpyxl


# Read the first worksheet of an .xlsx file and yield (row_number, {header: value})
# for each non-empty data row. Headers are matched case-insensitively and with
# surrounding whitespace stripped; unknown columns are ignored.
#
# `required_headers` lists the headers that must be present in the sheet at all
# (not per-row) - if none of the data is usable without them, raise ValueError so
# the endpoint can return a 400 with a helpful message.
def read_excel_rows(file_stream, required_headers):
    workbook = openpyxl.load_workbook(file_stream, read_only=True, data_only=True)
    worksheet = workbook.worksheets[0]
    rows = worksheet.iter_rows(values_only=True)

    try:
        header_row = next(rows)
    except StopIteration:
        raise ValueError('the uploaded file is empty')

    header_map = {}
    for index, header in enumerate(header_row):
        if header is None:
            continue
        header_map[str(header).strip().lower()] = index

    missing = [h for h in required_headers if h.lower() not in header_map]
    if missing:
        raise ValueError(f"missing required column(s): {', '.join(missing)}")

    for row_number, row in enumerate(rows, start=2):
        if row is None or all(cell is None for cell in row):
            continue

        record = {}
        for header, index in header_map.items():
            record[header] = row[index] if index < len(row) else None

        yield row_number, record


# Normalize a cell value to a trimmed string, or None if it's empty.
# Excel often represents whole numbers (e.g. serial numbers) as floats, so a
# value like 12345.0 is converted back to "12345" rather than "12345.0".
def normalize_str(value):
    if value is None:
        return None

    if isinstance(value, float) and value.is_integer():
        value = int(value)

    text = str(value).strip()
    return text or None


# Build the standard JSON response shape returned by every import endpoint.
def build_import_response(imported_count, errors):
    return {
        'imported': imported_count,
        'skipped': len(errors),
        'errors': [{'row': row, 'reason': reason} for row, reason in errors],
    }
