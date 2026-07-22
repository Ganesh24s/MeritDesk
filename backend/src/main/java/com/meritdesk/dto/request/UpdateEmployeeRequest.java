package com.meritdesk.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class UpdateEmployeeRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private Long departmentId;

    private String role; // EMPLOYEE or DEPARTMENT_ADMIN

    private List<Long> skillIds;

    private int maxCapacity;

    private boolean active;
}
