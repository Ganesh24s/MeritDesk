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
public class DashboardStatsResponse {
    private long totalCompanies;
    private long activeCompanies;
    private long pendingCompanies;
    private long totalTickets;
    private long openTickets;
    private long resolvedTickets;
    private long totalEmployees;
    private long totalCustomers;
    private double slaComplianceRate;
    private Map<String, Long> ticketsByPriority;
    private Map<String, Long> ticketsByStatus;
    
    // Company Admin additions
    private long totalDepartments;
    private long activeTickets;
    private List<RecentActivityResponse> recentActivity;
    private List<EmployeeResponse> topEmployees;
    private Map<String, Long> slaBreachesByDepartment;
    private List<Map<String, Object>> ticketTrends;
}
