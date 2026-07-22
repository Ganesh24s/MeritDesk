package com.meritdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateTicketRequest {

    private String status; // IN_PROGRESS, RESOLVED

    @NotBlank(message = "Comment is required")
    private String comment;
}
