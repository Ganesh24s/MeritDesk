package com.meritdesk.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.meritdesk.dto.request.CreateTicketRequest;
import com.meritdesk.dto.request.FeedbackRequest;
import com.meritdesk.dto.request.UpdateTicketRequest;
import com.meritdesk.dto.response.FeedbackResponse;
import com.meritdesk.dto.response.TicketHistoryResponse;
import com.meritdesk.dto.response.TicketResponse;
import com.meritdesk.entity.Department;
import com.meritdesk.entity.Feedback;
import com.meritdesk.entity.SLAPolicy;
import com.meritdesk.entity.Ticket;
import com.meritdesk.entity.TicketHistory;
import com.meritdesk.entity.User;
import com.meritdesk.enums.TicketPriority;
import com.meritdesk.enums.TicketStatus;
import com.meritdesk.exception.BadRequestException;
import com.meritdesk.exception.ResourceNotFoundException;
import com.meritdesk.repository.DepartmentRepository;
import com.meritdesk.repository.FeedbackRepository;
import com.meritdesk.repository.SLAPolicyRepository;
import com.meritdesk.repository.TicketHistoryRepository;
import com.meritdesk.repository.TicketRepository;
import com.meritdesk.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final DepartmentRepository departmentRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final FeedbackRepository feedbackRepository;
    private final AssignmentEngine assignmentEngine;
    private final HonourScoreService honourScoreService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, User customer) {
        User dbCustomer = userRepository.findById(customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Long companyId = dbCustomer.getCompany().getId();

        Department department = departmentRepository.findByIdAndCompanyId(request.getDepartmentId(), companyId)
                .orElseThrow(() -> new BadRequestException("Department not found in your company"));

        TicketPriority priority = TicketPriority.valueOf(request.getPriority().toUpperCase());

        Ticket ticket = Ticket.builder()
                .company(dbCustomer.getCompany())
                .department(department)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(priority)
                .status(TicketStatus.OPEN)
                .category(request.getCategory())
                .requiredSkills(request.getRequiredSkills())
                .raisedBy(dbCustomer)
                .build();

        // Set SLA deadlines
        String category = request.getCategory() != null ? request.getCategory().trim() : null;
        Optional<SLAPolicy> slaOpt = Optional.empty();
        if (category != null && !category.isEmpty()) {
            slaOpt = slaPolicyRepository.findByCompanyIdAndPriorityAndCategoryAndActiveTrue(companyId, priority, category);
        }
        if (slaOpt.isEmpty()) {
            slaOpt = slaPolicyRepository.findByCompanyIdAndPriorityAndCategoryIsNullAndActiveTrue(companyId, priority);
        }
        if (slaOpt.isEmpty()) {
            // Fall back to original method if active-only query is empty (backward compatibility)
            slaOpt = slaPolicyRepository.findByCompanyIdAndPriority(companyId, priority);
        }
        if (slaOpt.isPresent()) {
            SLAPolicy sla = slaOpt.get();
            LocalDateTime now = LocalDateTime.now();
            ticket.setSlaResponseDeadline(now.plusMinutes(sla.getResponseTimeMinutes()));
            ticket.setSlaResolutionDeadline(now.plusMinutes(sla.getResolutionTimeMinutes()));
        }

        ticket = ticketRepository.save(ticket);

        // Add history entry
        addHistory(ticket, TicketStatus.OPEN, "Ticket created by customer", customer);

        // Check department load for overflow
        int deptLoad = ticketRepository.sumWorkloadWeightByDepartment(department.getId());
        double loadPercent = (double) deptLoad / department.getCapacity() * 100;

        if (loadPercent > 90) {
            ticket.setInOverflow(true);
            ticketRepository.save(ticket);
            log.info("Ticket #{} sent to overflow queue (dept load: {}%)", ticket.getId(), String.format("%.0f", loadPercent));
        } else {
            // Try to assign immediately
            User assignee = assignmentEngine.assignTicket(ticket);
            if (assignee != null) {
                ticket = ticketRepository.save(ticket);
                addHistory(ticket, TicketStatus.ASSIGNED, 
                        "Assigned to " + assignee.getName() + " by intelligent engine", null);
            }
        }

        notificationService.notifyDepartmentAdmins(companyId, department.getId(),
                "🆕 New Ticket #" + ticket.getId() + " raised: '" + ticket.getTitle() + "'",
                "NEW_TICKET");
        notificationService.notifyCompanyAdmins(companyId,
                "🆕 New Ticket #" + ticket.getId() + " raised: '" + ticket.getTitle() + "'",
                "NEW_TICKET");

        auditService.log(customer, "CREATE_TICKET", "Created ticket: " + ticket.getTitle(), "Ticket", ticket.getId());

        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse updateTicketStatus(Long ticketId, UpdateTicketRequest request, User employee) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        User dbEmployee = userRepository.findById(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(dbEmployee.getId())) {
            throw new BadRequestException("This ticket is not assigned to you");
        }

        if (request.getStatus() != null) {
            TicketStatus newStatus = TicketStatus.valueOf(request.getStatus().toUpperCase());
            ticket.setStatus(newStatus);

            if (newStatus == TicketStatus.RESOLVED || newStatus == TicketStatus.CLOSED) {
                ticket.setResolvedAt(LocalDateTime.now());
                ticket.setEscalated(false);
                if (newStatus == TicketStatus.RESOLVED) {
                    // Check if SLA was met
                    if (!ticket.isSlaResolutionBreached()) {
                        honourScoreService.onSlaMet(dbEmployee);
                    }
                    // Notify customer
                    if (ticket.getRaisedBy() != null) {
                        notificationService.send(ticket.getRaisedBy(),
                                String.format("Your ticket #%d '%s' has been resolved!", ticket.getId(), ticket.getTitle()),
                                "RESOLUTION");
                    }
                }
            }
        }

        ticket.setLastUpdatedByEmployee(LocalDateTime.now());
        ticket = ticketRepository.save(ticket);

        addHistory(ticket, ticket.getStatus(), request.getComment(), dbEmployee);

        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse reopenTicket(Long ticketId, User customer) {
        try {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

            User dbCustomer = userRepository.findById(customer.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

            if (ticket.getRaisedBy() == null) {
                throw new BadRequestException("Ticket raisedBy is null");
            }

            log.info("Reopening ticket: id={}, raisedBy={}, customer={}", ticket.getId(), ticket.getRaisedBy().getId(), dbCustomer.getId());

            User raisedBy = userRepository.findById(ticket.getRaisedBy().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket creator not found"));

            if (!raisedBy.getId().equals(dbCustomer.getId())) {
                throw new BadRequestException("This is not your ticket. Raised by ID: " + raisedBy.getId() + ", Request by ID: " + dbCustomer.getId());
            }

            if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED) {
                throw new BadRequestException("Ticket can only be reopened from RESOLVED or CLOSED status. Current status: " + ticket.getStatus());
            }

            ticket.setStatus(TicketStatus.REOPENED);
            ticket = ticketRepository.save(ticket);

            // Penalize the assignee
            if (ticket.getAssignedTo() != null) {
                User assignee = userRepository.findById(ticket.getAssignedTo().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
                log.info("Penalizing assignee: {}", assignee.getId());
                honourScoreService.onTicketReopened(assignee);
                notificationService.send(assignee,
                        String.format("Ticket #%d has been reopened by the customer.", ticket.getId()),
                        "REOPEN");
            }

            addHistory(ticket, TicketStatus.REOPENED, "Reopened by customer", dbCustomer);

            return toResponse(ticket);
        } catch (Exception ex) {
            log.error("Error reopening ticket", ex);
            throw new BadRequestException("Reopen failed: " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
        }
    }

    @Transactional
    public TicketResponse addCustomerComment(Long ticketId, String comment, User customer) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (!ticket.getRaisedBy().getId().equals(customer.getId())) {
            throw new BadRequestException("This is not your ticket");
        }

        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BadRequestException("Cannot add comment to a resolved or closed ticket");
        }

        addHistory(ticket, ticket.getStatus(), comment, customer);
        
        // Notify employee if assigned
        if (ticket.getAssignedTo() != null) {
            notificationService.send(ticket.getAssignedTo(),
                    String.format("Customer replied on ticket #%d '%s'", ticket.getId(), ticket.getTitle()),
                    "COMMENT");
        }

        return toResponse(ticket);
    }

    @Transactional
    public FeedbackResponse rateTicket(Long ticketId, FeedbackRequest request, User customer) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        if (!ticket.getRaisedBy().getId().equals(customer.getId())) {
            throw new BadRequestException("This is not your ticket");
        }

        if (feedbackRepository.existsByTicketId(ticketId)) {
            throw new BadRequestException("Feedback already submitted for this ticket");
        }

        Feedback feedback = Feedback.builder()
                .ticket(ticket)
                .rating(request.getRating())
                .comment(request.getComment())
                .customer(customer)
                .build();
        feedback = feedbackRepository.save(feedback);

        // Update honour score based on rating
        if (ticket.getAssignedTo() != null) {
            if (request.getRating() >= 4) {
                honourScoreService.onPositiveFeedback(ticket.getAssignedTo());
            } else if (request.getRating() <= 2) {
                honourScoreService.onNegativeFeedback(ticket.getAssignedTo());
            }
        }

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .customerName(customer.getName())
                .createdAt(feedback.getCreatedAt())
                .build();
    }

    public List<TicketResponse> getTicketsByCustomer(Long customerId) {
        return ticketRepository.findByRaisedById(customerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getTicketsByEmployee(Long employeeId) {
        return ticketRepository.findByAssignedToId(employeeId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getTicketsByCompany(Long companyId) {
        return ticketRepository.findByCompanyId(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getTicketsByDepartment(Long departmentId) {
        return ticketRepository.findByDepartmentId(departmentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TicketResponse> getOverflowTickets(Long companyId) {
        return ticketRepository.findByCompanyIdAndInOverflowTrue(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketResponse claimOverflowTicket(Long ticketId, User employee) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));

        User dbEmployee = userRepository.findById(employee.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (!ticket.isInOverflow()) {
            throw new BadRequestException("This ticket is not in the overflow queue");
        }

        if (!honourScoreService.canAccessOverflow(dbEmployee)) {
            throw new BadRequestException("Your Honour Score must be 80+ to claim overflow tickets");
        }

        ticket.setInOverflow(false);
        ticket.setAssignedTo(dbEmployee);
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setAssignmentReasoning("Claimed from overflow by " + dbEmployee.getName());
        ticket = ticketRepository.save(ticket);

        addHistory(ticket, TicketStatus.ASSIGNED, "Claimed from overflow queue", dbEmployee);

        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse overrideAssignment(Long ticketId, Long employeeId, User admin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
 
        User newAssignee = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        User dbAdmin = userRepository.findById(admin.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
 
        ticket.setAssignedTo(newAssignee);
        ticket.setInOverflow(false);
        ticket.setEscalated(false);
        ticket.setStatus(TicketStatus.ASSIGNED);
        ticket.setAssignmentReasoning("Manually assigned by " + dbAdmin.getName());
        ticket = ticketRepository.save(ticket);
 
        addHistory(ticket, TicketStatus.ASSIGNED, "Manually reassigned by admin", dbAdmin);
 
        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse requestExtension(Long ticketId, String reason, LocalDateTime deadline, User employee) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(employee.getId())) {
            throw new BadRequestException("Ticket is not assigned to you");
        }
        ticket.setExtensionRequested(true);
        ticket.setExtensionReason(reason);
        ticket.setExtensionRequestedDeadline(deadline);
        ticket = ticketRepository.save(ticket);

        addHistory(ticket, ticket.getStatus(), "SLA resolution extension requested: " + reason, employee);

        // Notify company admins
        notificationService.notifyCompanyAdmins(ticket.getCompany().getId(),
                "Extension request on Ticket #" + ticket.getId() + " by " + employee.getName() + ": " + reason,
                "EXTENSION");

        return toResponse(ticket);
    }

    @Transactional
    public TicketResponse handleExtensionRequest(Long ticketId, boolean approve, User admin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (!ticket.isExtensionRequested()) {
            throw new BadRequestException("No extension request pending on this ticket");
        }

        User dbAdmin = userRepository.findById(admin.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (approve) {
            ticket.setSlaResolutionDeadline(ticket.getExtensionRequestedDeadline());
            ticket.setSlaResolutionBreached(false); // Reset breach flag
            addHistory(ticket, ticket.getStatus(), "SLA extension approved by admin. New deadline: " + ticket.getExtensionRequestedDeadline(), dbAdmin);
            
            if (ticket.getAssignedTo() != null) {
                notificationService.send(ticket.getAssignedTo(),
                        "Your SLA extension request on Ticket #" + ticket.getId() + " was APPROVED.",
                        "EXTENSION");
            }
        } else {
            addHistory(ticket, ticket.getStatus(), "SLA extension request rejected by admin", dbAdmin);
            
            if (ticket.getAssignedTo() != null) {
                notificationService.send(ticket.getAssignedTo(),
                        "Your SLA extension request on Ticket #" + ticket.getId() + " was REJECTED.",
                        "EXTENSION");
            }
        }

        ticket.setExtensionRequested(false);
        ticket.setExtensionReason(null);
        ticket.setExtensionRequestedDeadline(null);
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public TicketResponse escalateTicket(Long ticketId, User admin) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        ticket.setEscalated(true);
        ticket.setPriority(TicketPriority.CRITICAL);
        // Shorten deadline to 2 hours from now
        ticket.setSlaResolutionDeadline(LocalDateTime.now().plusHours(2));
        ticket = ticketRepository.save(ticket);

        User dbAdmin = userRepository.findById(admin.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        addHistory(ticket, ticket.getStatus(), "Ticket escalated by admin to Critical priority", dbAdmin);

        // Notify assigned employee
        if (ticket.getAssignedTo() != null) {
            notificationService.send(ticket.getAssignedTo(),
                    "⚠️ Ticket #" + ticket.getId() + " has been escalated to CRITICAL priority!",
                    "ESCALATION");
        }

        // Notify company admins
        notificationService.notifyCompanyAdmins(ticket.getCompany().getId(),
                "⚠️ Ticket #" + ticket.getId() + " has been escalated by " + dbAdmin.getName() + "!",
                "ESCALATION");

        return toResponse(ticket);
    }

    public TicketResponse getTicketById(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        return toResponse(ticket);
    }

    private void addHistory(Ticket ticket, TicketStatus status, String comment, User changedBy) {
        TicketHistory history = TicketHistory.builder()
                .ticket(ticket)
                .status(status)
                .comment(comment)
                .changedBy(changedBy)
                .build();
        ticketHistoryRepository.save(history);
    }

    private TicketResponse toResponse(Ticket ticket) {
        List<TicketHistoryResponse> history = ticketHistoryRepository
                .findByTicketIdOrderByTimestampDesc(ticket.getId()).stream()
                .map(h -> TicketHistoryResponse.builder()
                        .id(h.getId())
                        .status(h.getStatus() != null ? h.getStatus().name() : null)
                        .comment(h.getComment())
                        .changedByName(h.getChangedBy() != null ? h.getChangedBy().getName() : "System")
                        .changedByRole(h.getChangedBy() != null ? h.getChangedBy().getRole().name() : "SYSTEM")
                        .timestamp(h.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        FeedbackResponse feedbackResp = feedbackRepository.findByTicketId(ticket.getId())
                .map(f -> FeedbackResponse.builder()
                        .id(f.getId())
                        .rating(f.getRating())
                        .comment(f.getComment())
                        .customerName(f.getCustomer() != null ? f.getCustomer().getName() : null)
                        .createdAt(f.getCreatedAt())
                        .build())
                .orElse(null);

        LocalDateTime assignedAt = ticket.getAssignedAt();
        if (assignedAt == null && ticket.getAssignedTo() != null) {
            assignedAt = history.stream()
                    .filter(h -> "ASSIGNED".equals(h.getStatus()) || "IN_PROGRESS".equals(h.getStatus()))
                    .map(TicketHistoryResponse::getTimestamp)
                    .reduce((first, second) -> second)
                    .orElse(ticket.getCreatedAt());
        }

        LocalDateTime resolvedAt = ticket.getResolvedAt();
        if (resolvedAt == null && (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED)) {
            resolvedAt = history.stream()
                    .filter(h -> "RESOLVED".equals(h.getStatus()) || "CLOSED".equals(h.getStatus()))
                    .map(TicketHistoryResponse::getTimestamp)
                    .findFirst()
                    .orElse(ticket.getUpdatedAt());
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .priority(ticket.getPriority().name())
                .status(ticket.getStatus().name())
                .category(ticket.getCategory())
                .requiredSkills(ticket.getRequiredSkills())
                .departmentId(ticket.getDepartment() != null ? ticket.getDepartment().getId() : null)
                .departmentName(ticket.getDepartment() != null ? ticket.getDepartment().getName() : null)
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : null)
                .raisedById(ticket.getRaisedBy() != null ? ticket.getRaisedBy().getId() : null)
                .raisedByName(ticket.getRaisedBy() != null ? ticket.getRaisedBy().getName() : null)
                .raisedByEmail(ticket.getRaisedBy() != null ? ticket.getRaisedBy().getEmail() : null)
                .raisedByPhone(ticket.getRaisedBy() != null ? ticket.getRaisedBy().getPhone() : null)
                .slaResponseDeadline(ticket.getSlaResponseDeadline())
                .slaResolutionDeadline(ticket.getSlaResolutionDeadline())
                .slaResponseBreached(ticket.isSlaResponseBreached())
                .slaResolutionBreached(ticket.isSlaResolutionBreached())
                .inOverflow(ticket.isInOverflow())
                .assignmentReasoning(ticket.getAssignmentReasoning())
                .escalated(ticket.isEscalated() && ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED)
                .extensionRequested(ticket.isExtensionRequested())
                .extensionReason(ticket.getExtensionReason())
                .extensionRequestedDeadline(ticket.getExtensionRequestedDeadline())
                .assignedAt(assignedAt)
                .resolvedAt(resolvedAt)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .history(history)
                .feedback(feedbackResp)
                .build();
    }
}
