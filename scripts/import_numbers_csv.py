#!/usr/bin/env python3
"""
Turns a consumption log exported from Numbers (CSV: date, number of sacks) into SQL for pellet_entries.

Usage (put the CSV in import/, which git ignores):
    # locally: try it, then for real
    python3 scripts/import_numbers_csv.py import/forbrukning.csv --user <username> --dry-run \
        | docker exec -i pelletstracker-postgres psql -U pelletstracker -d pelletstracker
    python3 scripts/import_numbers_csv.py import/forbrukning.csv --user <username> \
        | docker exec -i pelletstracker-postgres psql -U pelletstracker -d pelletstracker

    # on the server, from the folder with compose.prod.yaml (database name and user from its .env)
    python3 import_numbers_csv.py forbrukning.csv --user <username> --dry-run \
        | docker compose -f compose.prod.yaml exec -T postgres psql -U <POSTGRES_USER> -d <POSTGRES_DB>

- Rows without an amount or with 0 (days nothing was used) are skipped; rows whose first cell is not a date
  (header, title) are skipped too.
- Sacks are converted to kg (16 kg per sack, as SACK_KG in frontend/src/lib/units.ts).
- A date that already has an entry for the user gets the sheet's value (overwrite), so running it
  twice gives the same result. Entries on dates not in the sheet are left alone.
- Everything runs in one transaction; --dry-run reports what would change and rolls back.

Only the standard library, so it runs wherever python3 does. The summary goes to stderr, the SQL to stdout.
"""

import argparse
import csv
import io
import re
import sys
from datetime import date
from decimal import Decimal, InvalidOperation

SACK_KG = 16
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def read_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        text = f.read()
    # Numbers uses ';' as separator when the decimal separator is a comma (Swedish settings), ',' otherwise.
    # Copy-pasted cells are tab separated
    try:
        dialect = csv.Sniffer().sniff(text[:4096], delimiters=";,\t")
    except csv.Error:
        dialect = csv.excel
    return list(csv.reader(io.StringIO(text), dialect))


def parse(rows):
    entries = {}
    errors = []
    for line_no, row in enumerate(rows, start=1):
        cells = [cell.strip() for cell in row]
        if len(cells) < 2 or not DATE_PATTERN.match(cells[0]):
            continue
        if not cells[1]:
            continue  # nothing logged that day

        try:
            day = date.fromisoformat(cells[0])
        except ValueError:
            errors.append(f"rad {line_no}: ogiltigt datum {cells[0]!r}")
            continue

        try:
            sacks = Decimal(cells[1].replace(",", ".").replace(" ", "").replace(" ", ""))
        except InvalidOperation:
            errors.append(f"rad {line_no}: {cells[1]!r} är inget antal säckar")
            continue

        if sacks == 0:
            continue  # the sheet writes 0 on days nothing was used; the app simply has no entry then

        kg = sacks * SACK_KG
        if kg < 0 or kg != kg.to_integral_value():
            errors.append(f"rad {line_no}: {cells[1]} säckar blir {kg} kg, appen sparar bara hela kg över 0")
            continue
        if day in entries:
            errors.append(f"rad {line_no}: {day} finns redan längre upp i arket")
            continue
        if day > date.today():
            errors.append(f"rad {line_no}: {day} ligger i framtiden")
            continue

        entries[day] = int(kg)
    return entries, errors


def sql_literal(text):
    return "'" + text.replace("'", "''") + "'"


def build_sql(entries, username, dry_run):
    values = ",\n".join(f"    ('{day.isoformat()}', {kg})" for day, kg in sorted(entries.items()))
    end = "ROLLBACK; -- dry run: nothing was saved" if dry_run else "COMMIT;"
    return f"""\\set ON_ERROR_STOP on
BEGIN;

-- Stops here (and rolls back) if the user does not exist
SELECT id AS import_user_id FROM app_users WHERE username = {sql_literal(username)} \\gset

CREATE TEMP TABLE import_rows (
    entry_date DATE PRIMARY KEY,
    amount_kg  INTEGER NOT NULL CHECK (amount_kg >= 1)
) ON COMMIT DROP;

INSERT INTO import_rows (entry_date, amount_kg) VALUES
{values};

SELECT
    count(*) FILTER (WHERE e.id IS NULL)                                AS nya,
    count(*) FILTER (WHERE e.id IS NOT NULL AND e.amount_kg <> i.amount_kg) AS skrivs_over,
    count(*) FILTER (WHERE e.id IS NOT NULL AND e.amount_kg = i.amount_kg)  AS oforandrade
FROM import_rows i
LEFT JOIN pellet_entries e ON e.user_id = :import_user_id AND e.entry_date = i.entry_date;

-- Not ON CONFLICT: databases baselined from the old Hibernate schema may lack a named unique constraint
UPDATE pellet_entries e
SET amount_kg = i.amount_kg
FROM import_rows i
WHERE e.user_id = :import_user_id
  AND e.entry_date = i.entry_date
  AND e.amount_kg <> i.amount_kg;

INSERT INTO pellet_entries (entry_date, amount_kg, user_id)
SELECT i.entry_date, i.amount_kg, :import_user_id
FROM import_rows i
WHERE NOT EXISTS (
    SELECT 1 FROM pellet_entries e WHERE e.user_id = :import_user_id AND e.entry_date = i.entry_date
);

{end}
"""


def main():
    parser = argparse.ArgumentParser(description="Numbers-CSV (datum, säckar) till SQL för pellet_entries")
    parser.add_argument("csv", help="CSV exporterad från Numbers")
    parser.add_argument("--user", required=True, help="användarnamnet i appen som posterna ska tillhöra")
    parser.add_argument("--dry-run", action="store_true", help="visa vad som skulle ändras, spara inget")
    args = parser.parse_args()

    entries, errors = parse(read_rows(args.csv))
    if errors:
        print("Inget skapades, rätta först:", file=sys.stderr)
        for error in errors:
            print(f"  {error}", file=sys.stderr)
        sys.exit(1)
    if not entries:
        print("Hittade inga rader med datum (ÅÅÅÅ-MM-DD) och antal säckar.", file=sys.stderr)
        sys.exit(1)

    days = sorted(entries)
    total_kg = sum(entries.values())
    print(
        f"{len(entries)} dagar, {days[0]} – {days[-1]}, totalt {total_kg} kg ({total_kg / SACK_KG:g} säckar)"
        + (" [dry run]" if args.dry_run else ""),
        file=sys.stderr,
    )
    sys.stdout.write(build_sql(entries, args.user, args.dry_run))


if __name__ == "__main__":
    main()
