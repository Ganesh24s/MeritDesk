package com.meritdesk.enums;

public enum TicketPriority {
    LOW(1),
    MEDIUM(2),
    HIGH(3),
    CRITICAL(5);

    private final int weight;

    TicketPriority(int weight) {
        this.weight = weight;
    }

    public int getWeight() {
        return weight;
    }
}
