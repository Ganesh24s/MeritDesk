package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponse {
    private Long id;
    private String name;
    private String description;
    private int capacity;
    private int currentLoad;
    private long employeeCount;
    private long ticketCount;
    private long activeTickets;
    private double slaComplianceRate;
    private boolean active;
}
