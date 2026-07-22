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
public class CompanyReportSummaryResponse {
    private List<DepartmentReportResponse> departmentReports;
    private List<EmployeeReportResponse> employeeReports;
    private List<SlaBreachReportResponse> breachReports;
    private List<EmployeeResponse> honourLeaderboard;
    private Map<String, Long> recurringCategories; // Recurring categories for SLA breaches
}
