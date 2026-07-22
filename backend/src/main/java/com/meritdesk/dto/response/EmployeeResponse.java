package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private Long departmentId;
    private String departmentName;
    private double honourScore;
    private String honourLevel;
    private boolean available;
    private String availabilityStatus;
    private int maxCapacity;
    private int currentWorkload;
    private boolean active;
    private List<SkillResponse> skills;
    private LocalDateTime createdAt;
}
