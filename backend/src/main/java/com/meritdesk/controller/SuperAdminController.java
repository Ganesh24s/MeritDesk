package com.meritdesk.controller;

import com.meritdesk.dto.response.ApiResponse;
import com.meritdesk.dto.response.CompanyResponse;
import com.meritdesk.dto.response.DashboardStatsResponse;
import com.meritdesk.service.CompanyService;
import com.meritdesk.repository.AuditLogRepository;
import com.meritdesk.repository.UserRepository;
import com.meritdesk.repository.TicketRepository;
import com.meritdesk.repository.CompanyRepository;
import com.meritdesk.entity.AuditLog;
import com.meritdesk.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SuperAdminController {

    private final CompanyService companyService;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.meritdesk.repository.DepartmentRepository departmentRepository;

    @GetMapping("/companies/{id}/details")
    public ResponseEntity<java.util.Map<String, Object>> getCompanyDetails(@PathVariable Long id) {
        java.util.Map<String, Object> details = new java.util.HashMap<>();

        // 1. Departments
        java.util.List<java.util.Map<String, Object>> depts = departmentRepository.findByCompanyId(id).stream()
                .map(d -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", d.getId());
                    map.put("name", d.getName());
                    map.put("description", d.getDescription());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
        details.put("departments", depts);

        // 2. Employees
        java.util.List<java.util.Map<String, Object>> emps = userRepository.findByCompanyId(id).stream()
                .filter(u -> u.isActive() && (u.getRole() == com.meritdesk.enums.Role.EMPLOYEE || u.getRole() == com.meritdesk.enums.Role.DEPARTMENT_ADMIN))
                .map(u -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole().name());
                    map.put("honourScore", u.getHonourScore());
                    map.put("active", u.isActive());
                    map.put("available", u.isAvailable());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
        details.put("employees", emps);

        // 3. Stats
        details.put("stats", companyService.getCompanyStats(id));

        return ResponseEntity.ok(details);
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findTop100ByOrderByTimestampDesc());
    }

    @GetMapping("/detailed-stats")
    public ResponseEntity<java.util.Map<String, Object>> getDetailedStats() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();

        // 1. Leaderboard: Top 5 employees globally by Honour Score
        java.util.List<java.util.Map<String, Object>> topEmployees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.meritdesk.enums.Role.EMPLOYEE || u.getRole() == com.meritdesk.enums.Role.DEPARTMENT_ADMIN)
                .sorted((a, b) -> Double.compare(b.getHonourScore(), a.getHonourScore()))
                .limit(5)
                .map(u -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", u.getId());
                    map.put("name", u.getName());
                    map.put("email", u.getEmail());
                    map.put("role", u.getRole().name());
                    map.put("honourScore", u.getHonourScore());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
        stats.put("topEmployees", topEmployees);

        // 2. Leaderboard: Top 5 companies by resolved tickets
        java.util.List<java.util.Map<String, Object>> topCompanies = companyRepository.findAll().stream()
                .map(c -> {
                    long resolved = ticketRepository.countResolvedByCompany(c.getId());
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("name", c.getName());
                    map.put("email", c.getEmail());
                    map.put("resolvedTickets", resolved);
                    return map;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("resolvedTickets"), (Long) a.get("resolvedTickets")))
                .limit(5)
                .collect(java.util.stream.Collectors.toList());
        stats.put("topCompanies", topCompanies);

        // 3. Global SLA Compliance
        long totalResolved = ticketRepository.findAll().stream()
                .filter(t -> t.getStatus() == com.meritdesk.enums.TicketStatus.RESOLVED || t.getStatus() == com.meritdesk.enums.TicketStatus.CLOSED)
                .count();
        long totalCompliant = ticketRepository.findAll().stream()
                .filter(t -> (t.getStatus() == com.meritdesk.enums.TicketStatus.RESOLVED || t.getStatus() == com.meritdesk.enums.TicketStatus.CLOSED) && !t.isSlaResolutionBreached())
                .count();
        double globalSla = totalResolved > 0 ? ((double) totalCompliant / totalResolved) * 100 : 100.0;
        stats.put("globalSlaComplianceRate", globalSla);

        // 4. Growth Trends (mocked for chart)
        java.util.List<java.util.Map<String, Object>> growth = new java.util.ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        for (int i = 0; i < 12; i++) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("month", months[i]);
            m.put("companies", i * 2 + 3);
            growth.add(m);
        }
        stats.put("growthTrends", growth);

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/super-admins")
    public ResponseEntity<ApiResponse> createSuperAdmin(@Valid @RequestBody com.meritdesk.dto.request.CustomerRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new com.meritdesk.exception.BadRequestException("Email already exists");
        }
        User superAdmin = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(com.meritdesk.enums.Role.SUPER_ADMIN)
                .active(true)
                .build();
        userRepository.save(superAdmin);
        return ResponseEntity.ok(new ApiResponse("Super Admin created successfully"));
    }

    @DeleteMapping("/super-admins/{id}")
    public ResponseEntity<ApiResponse> deleteSuperAdmin(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new com.meritdesk.exception.ResourceNotFoundException("Super Admin not found"));
        if (user.getRole() != com.meritdesk.enums.Role.SUPER_ADMIN) {
            throw new com.meritdesk.exception.BadRequestException("User is not a Super Admin");
        }
        userRepository.delete(user);
        return ResponseEntity.ok(new ApiResponse("Super Admin deleted successfully"));
    }

    @GetMapping("/super-admins")
    public ResponseEntity<List<User>> getSuperAdmins() {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.meritdesk.enums.Role.SUPER_ADMIN)
                .collect(java.util.stream.Collectors.toList()));
    }

    @GetMapping("/companies")
    public ResponseEntity<List<CompanyResponse>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<CompanyResponse> getCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompany(id));
    }

    @PutMapping("/companies/{id}/approve")
    public ResponseEntity<CompanyResponse> approveCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.approveCompany(id));
    }

    @PutMapping("/companies/{id}/reject")
    public ResponseEntity<CompanyResponse> rejectCompany(@PathVariable Long id,
                                                          @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(companyService.rejectCompany(id, reason));
    }

    @PutMapping("/companies/{id}/suspend")
    public ResponseEntity<CompanyResponse> suspendCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.suspendCompany(id));
    }

    @PutMapping("/companies/{id}/activate")
    public ResponseEntity<CompanyResponse> activateCompany(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.activateCompany(id));
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<ApiResponse> deleteCompany(@PathVariable Long id) {
        companyService.deleteCompany(id);
        return ResponseEntity.ok(ApiResponse.success("Company and all members deleted successfully"));
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(companyService.getPlatformStats());
    }

    @PostMapping("/companies/seed-sample-data")
    public ResponseEntity<ApiResponse> seedSampleCompanies() {
        companyService.seedSampleCompanies();
        return ResponseEntity.ok(ApiResponse.success("Sample companies and members seeded successfully"));
    }
}
