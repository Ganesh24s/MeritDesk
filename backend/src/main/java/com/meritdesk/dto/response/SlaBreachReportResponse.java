package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaBreachReportResponse {
    private Long ticketId;
    private String title;
    private String priority;
    private String category;
    private String departmentName;
    private String assignedToName;
    private LocalDateTime breachedDeadline;
    private String breachType; // RESPONSE or RESOLUTION
    private String rootCause;
}
