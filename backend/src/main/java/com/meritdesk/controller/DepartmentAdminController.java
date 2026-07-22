package com.meritdesk.controller;

import com.meritdesk.dto.response.*;
import com.meritdesk.entity.Ticket;
import com.meritdesk.entity.User;
import com.meritdesk.enums.TicketStatus;
import com.meritdesk.service.DepartmentService;
import com.meritdesk.service.TicketService;
import com.meritdesk.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/department")
@PreAuthorize("hasAnyRole('DEPARTMENT_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DepartmentAdminController {

    private final DepartmentService departmentService;
    private final TicketService ticketService;
    private final com.meritdesk.repository.UserRepository userRepository;
    private final TicketRepository ticketRepository;

    @GetMapping("/team")
    public ResponseEntity<List<EmployeeResponse>> getTeam(@AuthenticationPrincipal User user) {
        User dbUser = userRepository.findById(user.getId()).orElse(user);
        if (dbUser.getDepartment() != null) {
            List<EmployeeResponse> team = departmentService.getEmployeesByDepartment(dbUser.getDepartment().getId());
            if (!team.isEmpty()) {
                return ResponseEntity.ok(team);
            }
        }
        return ResponseEntity.ok(departmentService.getEmployeesByCompany(dbUser.getCompany().getId()));
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> getDepartmentTickets(@AuthenticationPrincipal User user) {
        User dbUser = userRepository.findById(user.getId()).orElse(user);
        if (dbUser.getCompany() != null) {
            return ResponseEntity.ok(ticketService.getTicketsByCompany(dbUser.getCompany().getId()));
        }
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/override-assignment/{ticketId}")
    public ResponseEntity<TicketResponse> overrideAssignment(
            @PathVariable Long ticketId,
            @RequestParam Long employeeId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.overrideAssignment(ticketId, employeeId, user));
    }

    @GetMapping("/overflow")
    public ResponseEntity<List<TicketResponse>> getOverflowTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getOverflowTickets(user.getCompany().getId()));
    }

    @GetMapping("/department-info")
    public ResponseEntity<DepartmentResponse> getDepartmentInfo(@AuthenticationPrincipal User user) {
        if (user.getDepartment() != null) {
            return ResponseEntity.ok(departmentService.getDepartment(
                    user.getDepartment().getId(), user.getCompany().getId()));
        }
        return ResponseEntity.ok(null);
    }

    @GetMapping("/reports")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getDepartmentReports(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "ALL") String employeeId) {

        User dbUser = userRepository.findById(user.getId()).orElse(user);
        Long companyId = dbUser.getCompany() != null ? dbUser.getCompany().getId() : null;
        if (companyId == null) {
            return ResponseEntity.ok(Map.of());
        }

        List<Ticket> allTickets = ticketRepository.findByCompanyId(companyId);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);

        // Filter by date range
        List<Ticket> filtered = allTickets.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(cutoff))
                .collect(Collectors.toList());

        // Filter by employee if specified
        if (!"ALL".equalsIgnoreCase(employeeId)) {
            try {
                Long empId = Long.parseLong(employeeId);
                filtered = filtered.stream()
                        .filter(t -> t.getAssignedTo() != null && t.getAssignedTo().getId().equals(empId))
                        .collect(Collectors.toList());
            } catch (NumberFormatException ignored) {}
        }

        long totalCreated = filtered.size();
        List<Ticket> resolvedTickets = filtered.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                .collect(Collectors.toList());
        long totalResolved = resolvedTickets.size();

        // SLA Compliance
        long slaCompliant = resolvedTickets.stream()
                .filter(t -> !t.isSlaResolutionBreached())
                .count();
        double slaCompliancePercent = totalResolved > 0 ? Math.round(((double) slaCompliant / totalResolved) * 1000.0) / 10.0 : 100.0;

        // Avg resolution time in minutes
        double avgResolutionMins = 0;
        if (!resolvedTickets.isEmpty()) {
            long totalMins = resolvedTickets.stream()
                    .filter(t -> t.getUpdatedAt() != null && t.getCreatedAt() != null)
                    .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getUpdatedAt()).toMinutes())
                    .sum();
            avgResolutionMins = Math.round((double) totalMins / resolvedTickets.size());
        }

        // Trend data: per-day created/resolved counts
        List<Long> createdTrend = new ArrayList<>();
        List<Long> resolvedTrend = new ArrayList<>();
        List<String> trendLabels = new ArrayList<>();
        int trendDays = Math.min(days, 7);
        for (int i = trendDays - 1; i >= 0; i--) {
            LocalDateTime dayStart = LocalDateTime.now().minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            String label = dayStart.getDayOfWeek().toString().substring(0, 3);
            trendLabels.add(label);

            long created = filtered.stream()
                    .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(dayStart) && t.getCreatedAt().isBefore(dayEnd))
                    .count();
            long resolved = filtered.stream()
                    .filter(t -> (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                            && t.getUpdatedAt() != null && !t.getUpdatedAt().isBefore(dayStart) && t.getUpdatedAt().isBefore(dayEnd))
                    .count();
            createdTrend.add(created);
            resolvedTrend.add(resolved);
        }

        // Priority breakdown: [CRITICAL, HIGH, MEDIUM, LOW]
        List<Long> priorityBreakdown = List.of(
                filtered.stream().filter(t -> t.getPriority() == com.meritdesk.enums.TicketPriority.CRITICAL).count(),
                filtered.stream().filter(t -> t.getPriority() == com.meritdesk.enums.TicketPriority.HIGH).count(),
                filtered.stream().filter(t -> t.getPriority() == com.meritdesk.enums.TicketPriority.MEDIUM).count(),
                filtered.stream().filter(t -> t.getPriority() == com.meritdesk.enums.TicketPriority.LOW).count()
        );

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("slaCompliancePercent", slaCompliancePercent);
        report.put("avgResolutionMins", avgResolutionMins);
        report.put("totalCreated", totalCreated);
        report.put("totalResolved", totalResolved);
        report.put("createdTrend", createdTrend);
        report.put("resolvedTrend", resolvedTrend);
        report.put("trendLabels", trendLabels);
        report.put("priorityBreakdown", priorityBreakdown);

        return ResponseEntity.ok(report);
    }
}
