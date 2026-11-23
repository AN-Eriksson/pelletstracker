package me.andreaseriksson.pelletstracker.pellet;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Writes consumption as the CSV the history was first imported from (a Numbers sheet with Swedish
 * settings): no header, ';' as separator, CRLF line endings, one line per day from the first entry
 * until today, the amount in sacks with a decimal comma and an empty cell on days nothing was used.
 * scripts/import_numbers_csv.py reads it back unchanged.
 */
public final class ConsumptionCsvWriter {

    /** Kilograms per sack; the same value as SACK_KG in frontend/src/lib/units.ts and the import script */
    public static final int SACK_KG = 16;

    private ConsumptionCsvWriter() {
    }

    /**
     * @param entries the user's entries, in any order
     * @param today   the last day to write (or the last entry, if that is later)
     * @return the CSV text; empty when there are no entries
     */
    public static String write(Collection<PelletEntry> entries, LocalDate today) {
        if (entries.isEmpty()) {
            return "";
        }

        Map<LocalDate, Integer> kgByDate = entries.stream()
                .collect(Collectors.toMap(PelletEntry::getDate, PelletEntry::getAmountKg, Integer::sum));
        List<LocalDate> dates = kgByDate.keySet().stream().sorted().toList();
        LocalDate last = dates.getLast().isAfter(today) ? dates.getLast() : today;

        StringBuilder csv = new StringBuilder();
        for (LocalDate day = dates.getFirst(); !day.isAfter(last); day = day.plusDays(1)) {
            Integer kg = kgByDate.get(day);
            csv.append(day).append(';');
            if (kg != null) {
                csv.append(sacks(kg));
            }
            csv.append("\r\n");
        }
        return csv.toString();
    }

    /** 16 is a power of two, so kg / 16 always has a finite decimal expansion (at most four decimals) */
    static String sacks(int kg) {
        return BigDecimal.valueOf(kg)
                .divide(BigDecimal.valueOf(SACK_KG))
                .stripTrailingZeros()
                .toPlainString()
                .replace('.', ',');
    }
}
