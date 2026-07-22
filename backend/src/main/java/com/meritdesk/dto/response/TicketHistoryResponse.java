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
public class TicketHistoryResponse {
    private Long id;
    private String status;
    private String comment;
    private String changedByName;
    private String changedByRole;
    private LocalDateTime timestamp;
}
