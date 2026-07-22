package com.meritdesk.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.meritdesk.dto.request.CreateKBArticleRequest;
import com.meritdesk.dto.request.UpdateAdminProfileRequest;
import com.meritdesk.dto.request.UpdateTicketRequest;
import com.meritdesk.dto.response.ApiResponse;
import com.meritdesk.dto.response.EmployeeDashboardStats;
import com.meritdesk.dto.response.EmployeeResponse;
import com.meritdesk.dto.response.HonourScoreResponse;
import com.meritdesk.dto.response.KBArticleResponse;
import com.meritdesk.dto.response.PersonalReportResponse;
import com.meritdesk.dto.response.TicketResponse;
import com.meritdesk.entity.Ticket;
import com.meritdesk.entity.User;
import com.meritdesk.enums.HonourLevel;
import com.meritdesk.enums.Role;
import com.meritdesk.enums.TicketStatus;
import com.meritdesk.repository.HonourScoreHistoryRepository;
import com.meritdesk.repository.KnowledgeBaseArticleRepository;
import com.meritdesk.repository.TicketRepository;
import com.meritdesk.repository.UserRepository;
import com.meritdesk.service.AuthService;
import com.meritdesk.service.DepartmentService;
import com.meritdesk.service.KnowledgeBaseService;
import com.meritdesk.service.NotificationService;
import com.meritdesk.service.TicketService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employee")
@PreAuthorize("hasAnyRole('EMPLOYEE', 'DEPARTMENT_ADMIN', 'COMPANY_ADMIN')")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class EmployeeController {

    private final TicketService ticketService;
    private final KnowledgeBaseService knowledgeBaseService;
    private final DepartmentService departmentService;
    private final HonourScoreHistoryRepository honourHistoryRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final KnowledgeBaseArticleRepository knowledgeBaseArticleRepository;
    private final AuthService authService;
    private final NotificationService notificationService;

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> getMyTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getTicketsByEmployee(user.getId()));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PutMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(id, request, user));
    }

    @PostMapping("/tickets/{id}/claim")
    public ResponseEntity<TicketResponse> claimOverflowTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
            return ResponseEntity.ok(ticketService.claimOverflowTicket(id, user));
    }

    @PutMapping("/availability")
    public ResponseEntity<ApiResponse> updateAvailability(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User user) {
        if (status != null) {
            departmentService.updateEmployeeAvailability(user.getId(), status);
        } else {
            departmentService.toggleEmployeeAvailability(user.getId());
        }
        return ResponseEntity.ok(ApiResponse.success("Availability updated"));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<EmployeeDashboardStats> getDashboardStats(@AuthenticationPrincipal User user) {
        List<Ticket> myTickets = ticketRepository.findByAssignedToId(user.getId());
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);

        long assigned = myTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.ASSIGNED || t.getStatus() == TicketStatus.OPEN || t.getStatus() == TicketStatus.REOPENED)
                .count();

        long inProgress = myTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS)
                .count();

        long resolvedWeek = myTickets.stream()
                .filter(t -> (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED) 
                        && t.getUpdatedAt() != null && t.getUpdatedAt().isAfter(oneWeekAgo))
                .count();

        long breachesMonth = myTickets.stream()
                .filter(t -> t.isSlaResolutionBreached() && t.getUpdatedAt() != null && t.getUpdatedAt().isAfter(oneMonthAgo))
                .count();

        return ResponseEntity.ok(EmployeeDashboardStats.builder()
                .assignedCount(assigned)
                .inProgressCount(inProgress)
                .resolvedThisWeek(resolvedWeek)
                .slaBreachesThisMonth(breachesMonth)
                .build());
    }

    @GetMapping("/honour")
    
    public ResponseEntity<HonourScoreResponse> getHonourScore(@AuthenticationPrincipal User user) {
        User freshUser = userRepository.findByIdWithDepartment(user.getId())
                .orElseGet(() -> userRepository.findById(user.getId()).orElse(user));
        var history = honourHistoryRepository.findTop20ByEmployeeIdOrderByTimestampDesc(user.getId())
                .stream()
                .map(h -> HonourScoreResponse.HonourHistoryItem.builder()
                        .changeAmount(h.getChangeAmount())
                        .reason(h.getReason())
                        .scoreAfterChange(h.getScoreAfterChange())
                        .timestamp(h.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        // Calculate badges
        long resolved = ticketRepository.countResolvedTickets(user.getId(), LocalDateTime.now().minusYears(10));
        long compliant = ticketRepository.countSlaCompliantTickets(user.getId(), LocalDateTime.now().minusYears(10));
        boolean slaStarEarned = resolved >= 5 && compliant == resolved;
        boolean topPerformerEarned = freshUser.getHonourScore() >= 90;
        long kbArticles = knowledgeBaseArticleRepository.countByCreatedById(user.getId());
        boolean kbContributorEarned = kbArticles >= 3;

        List<HonourScoreResponse.BadgeInfo> badges = List.of(
            HonourScoreResponse.BadgeInfo.builder()
                .name("SLA Star")
                .description("Resolved at least 5 tickets with 100% SLA compliance.")
                .earned(slaStarEarned)
                .build(),
            HonourScoreResponse.BadgeInfo.builder()
                .name("Top Performer")
                .description("Maintained a Legend Honour Score (90+).")
                .earned(topPerformerEarned)
                .build(),
            HonourScoreResponse.BadgeInfo.builder()
                .name("Knowledge Contributor")
                .description("Published at least 3 articles in the Knowledge Base.")
                .earned(kbContributorEarned)
                .build()
        );

        // Leaderboard & Department Rank
        int deptRank = 1;
        List<HonourScoreResponse.LeaderboardEntry> leaderboard = new ArrayList<>();

        if (freshUser.getDepartment() != null) {
            List<User> deptMembers = new ArrayList<>(userRepository.findByDepartmentIdAndRoleIn(
                freshUser.getDepartment().getId(), List.of(Role.EMPLOYEE, Role.DEPARTMENT_ADMIN)));
            
            deptMembers.sort((a, b) -> Double.compare(b.getHonourScore(), a.getHonourScore()));

            for (int i = 0; i < deptMembers.size(); i++) {
                User member = deptMembers.get(i);
                if (member.getId().equals(freshUser.getId())) {
                    deptRank = i + 1;
                }
                leaderboard.add(HonourScoreResponse.LeaderboardEntry.builder()
                    .name(member.getName())
                    .score(member.getHonourScore())
                    .level(HonourLevel.fromScore(member.getHonourScore()).getDisplayName())
                    .isCurrentUser(member.getId().equals(freshUser.getId()))
                    .build());
            }
        } else {
            leaderboard.add(HonourScoreResponse.LeaderboardEntry.builder()
                .name(freshUser.getName())
                .score(freshUser.getHonourScore())
                .level(HonourLevel.fromScore(freshUser.getHonourScore()).getDisplayName())
                .isCurrentUser(true)
                .build());
        }

        return ResponseEntity.ok(HonourScoreResponse.builder()
                .currentScore(freshUser.getHonourScore())
                .level(HonourLevel.fromScore(freshUser.getHonourScore()).getDisplayName())
                .history(history)
                .badges(badges)
                .departmentRank(deptRank)
                .leaderboard(leaderboard)
                .build());
    }

    @GetMapping("/performance")
    public ResponseEntity<EmployeeResponse> getPerformance(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.getEmployee(user.getId()));
    }

    // Knowledge Base
    @GetMapping("/knowledge-base")
    public ResponseEntity<List<KBArticleResponse>> getKBArticles(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.getArticlesByCompany(user.getCompany().getId()));
    }

    @PostMapping("/knowledge-base")
    public ResponseEntity<KBArticleResponse> createKBArticle(
            @Valid @RequestBody CreateKBArticleRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.createArticle(request, user));
    }

    @GetMapping("/knowledge-base/search")
    public ResponseEntity<List<KBArticleResponse>> searchKB(
            @RequestParam String query,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.searchArticles(user.getCompany().getId(), query));
    }

    // SLA Extension Request
    @PostMapping("/tickets/{id}/request-extension")
    public ResponseEntity<TicketResponse> requestExtension(
            @PathVariable Long id,
            @Valid @RequestBody com.meritdesk.dto.request.SlaExtensionRequestDto request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.requestExtension(id, request.getReason(), request.getRequestedDeadline(), user));
    }

    // Overflow queue
    @GetMapping("/tickets/overflow")
    public ResponseEntity<List<TicketResponse>> getOverflowTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getOverflowTickets(user.getCompany().getId()));
    }

    // Update Profile
    @PutMapping("/profile")
    public ResponseEntity<EmployeeResponse> updateProfile(
            @Valid @RequestBody UpdateAdminProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.updateProfile(user.getId(), request));
    }

    // Notification settings
    @GetMapping("/notification-settings")
    public ResponseEntity<Map<String, Boolean>> getNotificationSettings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getEmailSettings(user.getId()));
    }

    @PutMapping("/notification-settings")
    public ResponseEntity<ApiResponse> updateNotificationSettings(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Boolean> settings) {
        notificationService.updateEmailSettings(user.getId(), settings);
        return ResponseEntity.ok(ApiResponse.success("Notification settings updated"));
    }

    // Personal Reports
    @GetMapping("/reports")
    public ResponseEntity<PersonalReportResponse> getReports(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime start;
        LocalDateTime end;
        try {
            if (startDate != null && !startDate.isBlank()) {
                if (startDate.endsWith("Z")) {
                    start = java.time.Instant.parse(startDate)
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime();
                } else {
                    start = LocalDateTime.parse(startDate);
                }
            } else {
                start = LocalDateTime.now().minusDays(30);
            }

            if (endDate != null && !endDate.isBlank()) {
                if (endDate.endsWith("Z")) {
                    end = java.time.Instant.parse(endDate)
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime();
                } else {
                    end = LocalDateTime.parse(endDate);
                }
            } else {
                end = LocalDateTime.now();
            }
        } catch (Exception ex) {
            start = LocalDateTime.now().minusDays(30);
            end = LocalDateTime.now();
        }

        final LocalDateTime finalStart = start;
        final LocalDateTime finalEnd = end;

        List<Ticket> myTickets = ticketRepository.findByAssignedToId(user.getId());

        List<Ticket> resolvedTickets = myTickets.stream()
                .filter(t -> (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                        && t.getUpdatedAt() != null && t.getUpdatedAt().isAfter(finalStart) && t.getUpdatedAt().isBefore(finalEnd))
                .toList();

        long totalResolved = resolvedTickets.size();

        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long resolvedThisMonth = myTickets.stream()
                .filter(t -> (t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                        && t.getUpdatedAt() != null && t.getUpdatedAt().isAfter(startOfMonth))
                .count();

        double avgResolutionTimeMinutes = 0.0;
        long compliantCount = 0;

        if (totalResolved > 0) {
            long totalMinutes = 0;
            for (Ticket t : resolvedTickets) {
                if (t.getCreatedAt() != null && t.getUpdatedAt() != null) {
                    java.time.Duration duration = java.time.Duration.between(t.getCreatedAt(), t.getUpdatedAt());
                    totalMinutes += duration.toMinutes();
                }
                if (!t.isSlaResolutionBreached()) {
                    compliantCount++;
                }
            }
            avgResolutionTimeMinutes = (double) totalMinutes / totalResolved;
        }

        double complianceRate = totalResolved > 0 ? ((double) compliantCount / totalResolved) * 100 : 100.0;

        // Resolution Trends
        Map<String, Long> trendMap = new TreeMap<>();
        LocalDateTime temp = start;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        while (temp.isBefore(end) || temp.isEqual(end)) {
            trendMap.put(temp.format(formatter), 0L);
            temp = temp.plusDays(1);
        }

        for (Ticket t : resolvedTickets) {
            String dateStr = t.getUpdatedAt().format(formatter);
            if (trendMap.containsKey(dateStr)) {
                trendMap.put(dateStr, trendMap.get(dateStr) + 1);
            }
        }

        List<PersonalReportResponse.TrendDataPoint> trends = trendMap.entrySet().stream()
                .map(e -> new PersonalReportResponse.TrendDataPoint(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        // Status Distribution
        Map<String, Long> statusDistribution = new HashMap<>();
        for (TicketStatus status : TicketStatus.values()) {
            statusDistribution.put(status.name(), 0L);
        }
        for (Ticket t : myTickets) {
            statusDistribution.put(t.getStatus().name(), statusDistribution.getOrDefault(t.getStatus().name(), 0L) + 1);
        }

        return ResponseEntity.ok(PersonalReportResponse.builder()
                .totalResolved(totalResolved)
                .resolvedThisMonth(resolvedThisMonth)
                .averageResolutionTimeMinutes(avgResolutionTimeMinutes)
                .slaComplianceRate(complianceRate)
                .resolutionTrends(trends)
                .statusDistribution(statusDistribution)
                .build());
    }
}
