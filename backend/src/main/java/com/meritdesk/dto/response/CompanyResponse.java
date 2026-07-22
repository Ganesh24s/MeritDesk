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
public class CompanyResponse {
    private Long id;
    private String name;
    private String email;
    private String status;
    private String industry;
    private String address;
    private String size;
    private String adminName;
    private String adminEmail;
    private String logoUrl;
    private String website;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private long totalEmployees;
    private long totalCustomers;
    private long totalTickets;
}
