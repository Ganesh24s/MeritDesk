package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeReportResponse {
    private Long employeeId;
    private String employeeName;
    private String departmentName;
    private long ticketsResolved;
    private double avgResolutionTimeHours;
    private double honourScore;
    private String honourLevel;
}
