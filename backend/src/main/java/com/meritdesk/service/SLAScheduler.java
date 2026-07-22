package com.meritdesk.service;

import com.meritdesk.entity.Ticket;
import com.meritdesk.entity.User;

import com.meritdesk.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j

public class SLAScheduler {

    private final TicketRepository ticketRepository;
    private final AssignmentEngine assignmentEngine;
    private final NotificationService notificationService;
    private final HonourScoreService honourScoreService;

    /**
     * Runs every minute to check SLA compliance.
     * 1. Detect near-breach tickets (< 20% time left) → notify
     * 2. Detect inactive tickets (no update > 50% of resolution time) → auto-reassign
     * 3. Detect fully breached tickets → mark and penalize
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkSlaCompliance() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Check for near-breach tickets
        checkNearBreach(now);

        // 2. Check for inactive tickets (Self-Healing SLA)
        checkInactiveTickets(now);

        // 3. Check for fully breached tickets
        checkBreachedTickets(now);
    }

    private void checkNearBreach(LocalDateTime now) {
        List<Ticket> activeTickets = ticketRepository.findActiveTicketsWithSlaDeadlines(now);

        for (Ticket ticket : activeTickets) {
            if (ticket.getSlaResolutionDeadline() == null) continue;

            Duration totalTime = Duration.between(ticket.getCreatedAt(), ticket.getSlaResolutionDeadline());
            Duration remaining = Duration.between(now, ticket.getSlaResolutionDeadline());

            // If less than 20% time remaining
            double remainingPercent = (double) remaining.toMinutes() / totalTime.toMinutes();
            if (remainingPercent <= 0.20 && remainingPercent > 0) {
                // Notify assigned employee
                if (ticket.getAssignedTo() != null) {
                    notificationService.send(ticket.getAssignedTo(),
                            String.format("⚠️ SLA Warning: Ticket #%d '%s' has less than 20%% time remaining! Deadline: %s",
                                    ticket.getId(), ticket.getTitle(), ticket.getSlaResolutionDeadline()),
                            "SLA_WARNING");
                }
                log.warn("Near-breach alert for ticket #{}: {}% time remaining", 
                        ticket.getId(), String.format("%.0f", remainingPercent * 100));
            }
        }
    }

    private void checkInactiveTickets(LocalDateTime now) {
        List<Ticket> activeTickets = ticketRepository.findActiveTicketsWithSlaDeadlines(now);

        for (Ticket ticket : activeTickets) {
            if (ticket.getSlaResolutionDeadline() == null || ticket.getAssignedTo() == null) continue;

            Duration totalTime = Duration.between(ticket.getCreatedAt(), ticket.getSlaResolutionDeadline());
            long halfTime = totalTime.toMinutes() / 2;

            // Check if no update for more than 50% of resolution time
            LocalDateTime lastUpdate = ticket.getLastUpdatedByEmployee() != null 
                    ? ticket.getLastUpdatedByEmployee() 
                    : ticket.getCreatedAt();

            Duration sinceLastUpdate = Duration.between(lastUpdate, now);

            if (sinceLastUpdate.toMinutes() > halfTime) {
                log.info("Self-Healing SLA: Auto-reassigning ticket #{} due to inactivity ({} min since last update)",
                        ticket.getId(), sinceLastUpdate.toMinutes());

                // Auto-reassign (Self-Healing SLA)
                User previousAssignee = ticket.getAssignedTo();
                User newAssignee = assignmentEngine.reassignTicket(ticket);

                if (newAssignee != null) {
                    ticketRepository.save(ticket);
                    notificationService.send(previousAssignee,
                            String.format("Ticket #%d was auto-reassigned due to inactivity.", ticket.getId()),
                            "REASSIGNMENT");

                    // Penalize the previous assignee
                    honourScoreService.onLateResolution(previousAssignee);
                }
            }
        }
    }

    private void checkBreachedTickets(LocalDateTime now) {
        List<Ticket> breachedTickets = ticketRepository.findBreachedTickets(now);

        for (Ticket ticket : breachedTickets) {
            ticket.setSlaResolutionBreached(true);
            ticketRepository.save(ticket);

            // Penalize assigned employee
            if (ticket.getAssignedTo() != null) {
                honourScoreService.onSlaBreach(ticket.getAssignedTo());
                notificationService.send(ticket.getAssignedTo(),
                        String.format("🚨 SLA Breached: Ticket #%d '%s' has exceeded its resolution deadline.",
                                ticket.getId(), ticket.getTitle()),
                        "SLA_BREACH");
            }

            if (ticket.getCompany() != null) {
                notificationService.notifyCompanyAdmins(ticket.getCompany().getId(),
                        String.format("🚨 SLA Breached: Ticket #%d '%s' has exceeded its resolution deadline.",
                                ticket.getId(), ticket.getTitle()),
                        "SLA_BREACH");
            }

            log.error("SLA BREACH: Ticket #{} has exceeded resolution deadline", ticket.getId());
        }
    }
}
