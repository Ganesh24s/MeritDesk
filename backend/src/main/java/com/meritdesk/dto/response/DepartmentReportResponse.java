package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentReportResponse {
    private Long departmentId;
    private String departmentName;
    private long totalTickets;
    private long activeTickets;
    private long resolvedTickets;
    private double slaComplianceRate;
    private int currentLoad;
    private int capacity;
}
