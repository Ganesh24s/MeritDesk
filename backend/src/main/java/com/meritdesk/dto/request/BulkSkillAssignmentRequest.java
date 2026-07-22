package com.meritdesk.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class BulkSkillAssignmentRequest {

    @NotEmpty(message = "Employee IDs list cannot be empty")
    private List<Long> employeeIds;

    @NotEmpty(message = "Skill IDs list cannot be empty")
    private List<Long> skillIds;
}
