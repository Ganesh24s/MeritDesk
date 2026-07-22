package com.meritdesk.enums;

public enum HonourLevel {
    UNDER_REVIEW("Under Review", 0, 59),
    NEEDS_IMPROVEMENT("Needs Improvement", 60, 69),
    RELIABLE("Reliable", 70, 79),
    TRUSTED("Trusted", 80, 89),
    LEGEND("Legend", 90, 100);

    private final String displayName;
    private final int minScore;
    private final int maxScore;

    HonourLevel(String displayName, int minScore, int maxScore) {
        this.displayName = displayName;
        this.minScore = minScore;
        this.maxScore = maxScore;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getMinScore() {
        return minScore;
    }

    public int getMaxScore() {
        return maxScore;
    }

    public static HonourLevel fromScore(double score) {
        if (score >= 90) return LEGEND;
        if (score >= 80) return TRUSTED;
        if (score >= 70) return RELIABLE;
        if (score >= 60) return NEEDS_IMPROVEMENT;
        return UNDER_REVIEW;
    }
}
