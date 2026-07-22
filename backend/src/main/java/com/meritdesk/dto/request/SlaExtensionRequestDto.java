package com.meritdesk.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SlaExtensionRequestDto {

    @NotBlank(message = "Reason for extension is required")
    private String reason;

    @NotNull(message = "Requested deadline is required")
    @Future(message = "Deadline must be in the future")
    private LocalDateTime requestedDeadline;
}
