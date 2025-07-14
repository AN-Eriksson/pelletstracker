package me.andreaseriksson.pelletstracker.pellet;

import java.util.ArrayList;
import java.util.List;

public class PelletHistory {
    private List<Pellet> pelletEntries;

    public PelletHistory(List<Pellet> entries) {
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
