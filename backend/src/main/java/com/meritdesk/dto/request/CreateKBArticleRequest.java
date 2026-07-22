package com.meritdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateKBArticleRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Solution is required")
    private String solution;

    private String tags; // comma-separated

    private Long ticketId; // optional source ticket
}
