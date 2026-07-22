package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HonourScoreResponse {
    private double currentScore;
    private String level;
    private List<HonourHistoryItem> history;
    private List<BadgeInfo> badges;
    private int departmentRank;
    private List<LeaderboardEntry> leaderboard;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HonourHistoryItem {
        private double changeAmount;
        private String reason;
        private double scoreAfterChange;
        private LocalDateTime timestamp;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BadgeInfo {
        private String name;
        private String description;
        private boolean earned;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaderboardEntry {
        private String name;
        private double score;
        private String level;
        private boolean isCurrentUser;
    }
}
