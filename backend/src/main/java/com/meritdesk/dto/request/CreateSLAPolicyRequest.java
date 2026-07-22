package com.meritdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSLAPolicyRequest {

    @NotBlank(message = "Priority is required")
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL

    @NotNull(message = "Response time is required")
    private Integer responseTimeMinutes;

    @NotNull(message = "Resolution time is required")
    private Integer resolutionTimeMinutes;

    private String category;

    private boolean active = true;
}
