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
public class KBArticleResponse {
    private Long id;
    private String title;
    private String description;
    private String solution;
    private String tags;
    private String createdByName;
    private Long sourceTicketId;
    private String status;
    private int viewCount;
    private int helpfulCount;
    private int unhelpfulCount;
    private LocalDateTime createdAt;
}
