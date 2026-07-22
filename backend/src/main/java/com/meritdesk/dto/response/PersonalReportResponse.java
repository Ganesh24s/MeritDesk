package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalReportResponse {
    private long totalResolved;
    private long resolvedThisMonth;
    private double averageResolutionTimeMinutes;
    private double slaComplianceRate;
    private List<TrendDataPoint> resolutionTrends;
    private Map<String, Long> statusDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendDataPoint {
        private String date;
        private long count;
    }
}
