package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDashboardStats {
    private long assignedCount;
    private long inProgressCount;
    private long resolvedThisWeek;
    private long slaBreachesThisMonth;
}
