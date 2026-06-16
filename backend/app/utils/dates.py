# Shared date parsing helper used by the maintenance routes and Excel imports.
from datetime import date, datetime


# Parse a date from either a 'YYYY-MM-DD' string or a datetime/date object
# (openpyxl returns native datetime objects for date-formatted Excel cells).
# Raises ValueError if a string value isn't in the expected format.
def parse_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return datetime.strptime(value, '%Y-%m-%d').date()
