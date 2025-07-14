package me.andreaseriksson.pelletstracker.pellet;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a history of pellet entries and provides methods for calculations
 * such as averages and other statistics on the pellet data.
 */
public class PelletHistory {
    /**
     * List of pellet entries in the history.
     */
    private List<PelletEntry> pelletEntries;

    /**
     * Constructs a new PelletHistory with the given list of pellet entries.
     *
     * @param entries the list of Pellet objects to initialize the history with
     */
    public PelletHistory(List<PelletEntry> entries) {
        this.pelletEntries = new ArrayList<>(entries);
    }

    /**
     * Returns the number of pellet entries in the history.
     *
     * @return the number of entries in the pellet history
     */
    public int numberOfEntries() {
        return pelletEntries.size();
    }

}
