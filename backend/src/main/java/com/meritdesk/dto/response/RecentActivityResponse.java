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
public class RecentActivityResponse {
    private String id;
    private String type; // TICKET_CREATED, TICKET_RESOLVED, SLA_BREACH, ESCALATION, EXTENSION_REQUEST
    private String message;
    private LocalDateTime timestamp;
}
