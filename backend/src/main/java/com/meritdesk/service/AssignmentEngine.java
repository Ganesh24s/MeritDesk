package com.meritdesk.service;

import com.meritdesk.entity.*;

import com.meritdesk.enums.TicketStatus;
import com.meritdesk.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AssignmentEngine {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final AssignmentHistoryRepository assignmentHistoryRepository;
    private final NotificationService notificationService;

    // Weight configuration
    private static final double WORKLOAD_WEIGHT = 0.30;
    private static final double HONOUR_WEIGHT = 0.25;
    private static final double SKILL_MATCH_WEIGHT = 0.20;
    private static final double AVAILABILITY_WEIGHT = 0.15;
    private static final double SLA_PERFORMANCE_WEIGHT = 0.10;

    /**
     * Assign a ticket to the best eligible employee.
     * Returns the assigned employee or null if no one is available.
     */
    public User assignTicket(Ticket ticket) {
        Long companyId = ticket.getCompany().getId();
        Long departmentId = ticket.getDepartment() != null ? ticket.getDepartment().getId() : null;

        // Get eligible employees
        List<User> candidates;
        if (departmentId != null) {
            candidates = userRepository.findAvailableEmployeesByDepartment(departmentId);
        } else {
            candidates = userRepository.findAvailableEmployeesByCompany(companyId);
        }

        if (candidates.isEmpty()) {
            log.warn("No available employees for ticket #{} in company {}", ticket.getId(), companyId);
            return null;
        }

        // Parse required skills from ticket
        Set<String> requiredSkills = parseSkills(ticket.getRequiredSkills());

        // Score each candidate
        User bestCandidate = null;
        double bestScore = -1;
        StringBuilder bestReasoning = new StringBuilder();

        for (User candidate : candidates) {
            double[] scores = new double[5];
            StringBuilder reasoning = new StringBuilder();

            // 1. Workload Score (30%) - lower workload = higher score
            int workload = ticketRepository.sumWorkloadWeightByEmployee(candidate.getId());
            int maxCapacity = candidate.getMaxCapacity();
            scores[0] = maxCapacity > 0 ? Math.max(0, (1.0 - (double) workload / maxCapacity)) * 100 : 0;
            reasoning.append(String.format("Workload: %d/%d (%.1f) ", workload, maxCapacity, scores[0]));

            // 2. Honour Score (25%) - direct score
            scores[1] = candidate.getHonourScore();
            reasoning.append(String.format("| Honour: %.1f ", scores[1]));

            // 3. Skill Match (20%)
            if (!requiredSkills.isEmpty()) {
                Set<String> employeeSkills = candidate.getSkills().stream()
                        .map(s -> s.getName().toLowerCase())
                        .collect(Collectors.toSet());
                long matched = requiredSkills.stream()
                        .filter(rs -> employeeSkills.contains(rs.toLowerCase()))
                        .count();
                scores[2] = ((double) matched / requiredSkills.size()) * 100;
            } else {
                scores[2] = 100; // No skills required, full match
            }
            reasoning.append(String.format("| SkillMatch: %.1f ", scores[2]));

            // 4. Availability Score (15%)
            if (candidate.getAvailabilityStatus().equalsIgnoreCase("ONLINE")) {
                scores[3] = 100;
            } else if (candidate.getAvailabilityStatus().equalsIgnoreCase("BUSY")) {
                scores[3] = 30;
            } else {
                scores[3] = 0;
            }
            reasoning.append(String.format("| Available: %.0f (%s) ", scores[3], candidate.getAvailabilityStatus()));

            // 5. Recent SLA Performance (10%) - compliance in last 30 days
            LocalDateTime since = LocalDateTime.now().minusDays(30);
            long resolved = ticketRepository.countResolvedTickets(candidate.getId(), since);
            long compliant = ticketRepository.countSlaCompliantTickets(candidate.getId(), since);
            scores[4] = resolved > 0 ? ((double) compliant / resolved) * 100 : 100; // New employees get benefit of doubt
            reasoning.append(String.format("| SLA: %d/%d (%.1f)", compliant, resolved, scores[4]));

            // Calculate weighted total
            double totalScore = (scores[0] * WORKLOAD_WEIGHT) +
                               (scores[1] * HONOUR_WEIGHT) +
                               (scores[2] * SKILL_MATCH_WEIGHT) +
                               (scores[3] * AVAILABILITY_WEIGHT) +
                               (scores[4] * SLA_PERFORMANCE_WEIGHT);

            reasoning.append(String.format(" => Total: %.2f", totalScore));

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestCandidate = candidate;
                bestReasoning = reasoning;
            }
        }

        if (bestCandidate != null) {
            // Assign the ticket
            ticket.setAssignedTo(bestCandidate);
            ticket.setStatus(TicketStatus.ASSIGNED);
            ticket.setAssignmentReasoning(bestReasoning.toString());

            // Save assignment history
            AssignmentHistory history = AssignmentHistory.builder()
                    .ticket(ticket)
                    .employee(bestCandidate)
                    .score(bestScore)
                    .reasoning(bestReasoning.toString())
                    .build();
            assignmentHistoryRepository.save(history);

            // Notify the employee
            notificationService.send(bestCandidate,
                    String.format("New ticket assigned: #%d - %s [%s]", 
                            ticket.getId(), ticket.getTitle(), ticket.getPriority()),
                    "ASSIGNMENT");

            log.info("Ticket #{} assigned to {} (score: {:.2f})", 
                    ticket.getId(), bestCandidate.getName(), bestScore);
        }

        return bestCandidate;
    }

    /**
     * Re-assign a ticket to the next best available employee (for SLA self-healing).
     */
    public User reassignTicket(Ticket ticket) {
        User previousAssignee = ticket.getAssignedTo();
        ticket.setAssignedTo(null);

        User newAssignee = assignTicket(ticket);

        if (newAssignee != null && previousAssignee != null) {
            notificationService.send(previousAssignee,
                    String.format("Ticket #%d has been reassigned due to inactivity.", ticket.getId()),
                    "REASSIGNMENT");
        }

        return newAssignee;
    }

    private Set<String> parseSkills(String skillsStr) {
        if (skillsStr == null || skillsStr.isBlank()) {
            return Collections.emptySet();
        }
        return Arrays.stream(skillsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
