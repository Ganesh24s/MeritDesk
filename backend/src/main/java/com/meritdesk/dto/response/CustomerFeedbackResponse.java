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
public class CustomerFeedbackResponse {
    private Long id;
    private Long ticketId;
    private String ticketTitle;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
