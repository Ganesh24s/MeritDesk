package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDashboardStats {
    private long activeTicketsCount;
    private long inProgressTicketsCount;
    private long resolvedTicketsCount;
    private long awaitingFeedbackCount;
}
