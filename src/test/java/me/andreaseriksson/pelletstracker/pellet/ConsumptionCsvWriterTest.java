package me.andreaseriksson.pelletstracker.pellet;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ConsumptionCsvWriterTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 1, 5);

    @Test
    void noEntries_givesEmptyText() {
        assertEquals("", ConsumptionCsvWriter.write(List.of(), TODAY));
    }

    @Test
    void writesEveryDayUntilToday_withEmptyCellsOnDaysWithoutEntries() {
        var entries = List.of(
                new PelletEntry(LocalDate.of(2026, 1, 3), 16),
                new PelletEntry(LocalDate.of(2026, 1, 1), 240));

        assertEquals("""
                2026-01-01;15\r
                2026-01-02;\r
                2026-01-03;1\r
                2026-01-04;\r
                2026-01-05;\r
                """, ConsumptionCsvWriter.write(entries, TODAY));
    }

    @Test
    void entryAfterToday_extendsTheFile() {
        var entries = List.of(new PelletEntry(LocalDate.of(2026, 1, 6), 32));

        assertEquals("2026-01-06;2\r\n", ConsumptionCsvWriter.write(entries, TODAY));
    }

    @Test
    void sacks_useDecimalCommaWithoutTrailingZeros() {
        assertEquals("1", ConsumptionCsvWriter.sacks(16));
        assertEquals("0,5", ConsumptionCsvWriter.sacks(8));
        assertEquals("1,25", ConsumptionCsvWriter.sacks(20));
        assertEquals("0,0625", ConsumptionCsvWriter.sacks(1));
        assertEquals("10", ConsumptionCsvWriter.sacks(160));
    }
}
