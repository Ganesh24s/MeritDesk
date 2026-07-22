package com.meritdesk.controller;

import com.meritdesk.dto.request.CreateTicketRequest;
import com.meritdesk.dto.request.FeedbackRequest;
import com.meritdesk.dto.request.UpdateAdminProfileRequest;
import com.meritdesk.dto.response.*;
import com.meritdesk.entity.User;
import com.meritdesk.entity.Ticket;
import com.meritdesk.entity.Feedback;
import com.meritdesk.enums.TicketStatus;
import com.meritdesk.repository.UserRepository;
import com.meritdesk.repository.TicketRepository;
import com.meritdesk.repository.FeedbackRepository;
import com.meritdesk.service.TicketService;
import com.meritdesk.service.DepartmentService;
import com.meritdesk.service.SkillService;
import com.meritdesk.service.AuthService;
import com.meritdesk.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CustomerController {

    private final TicketService ticketService;
    private final DepartmentService departmentService;
    private final SkillService skillService;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final FeedbackRepository feedbackRepository;
    private final AuthService authService;
    private final NotificationService notificationService;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> getDepartments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.getDepartmentsByCompany(user.getCompany().getId()));
    }

    @GetMapping("/skills")
    public ResponseEntity<List<SkillResponse>> getSkills(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.getSkillsByCompany(user.getCompany().getId()));
    }

    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.createTicket(request, user));
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> getMyTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getTicketsByCustomer(user.getId()));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PostMapping("/tickets/{id}/rate")
    public ResponseEntity<FeedbackResponse> rateTicket(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.rateTicket(id, request, user));
    }

    @PostMapping("/tickets/{id}/reopen")
    public ResponseEntity<TicketResponse> reopenTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.reopenTicket(id, user));
    }

    @PostMapping("/tickets/{id}/comment")
    public ResponseEntity<TicketResponse> addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String comment = body.get("comment");
        if (comment == null || comment.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(ticketService.addCustomerComment(id, comment, user));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<CustomerDashboardStats> getDashboardStats(@AuthenticationPrincipal User user) {
        List<Ticket> myTickets = ticketRepository.findByRaisedById(user.getId());
        
        long active = myTickets.stream()
                .filter(t -> t.getStatus() != TicketStatus.RESOLVED && t.getStatus() != TicketStatus.CLOSED)
                .count();
                
        long inProgress = myTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS)
                .count();
                
        long resolved = myTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                .count();
                
        long awaitingFeedback = myTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED && !feedbackRepository.existsByTicketId(t.getId()))
                .count();
                
        return ResponseEntity.ok(CustomerDashboardStats.builder()
                .activeTicketsCount(active)
                .inProgressTicketsCount(inProgress)
                .resolvedTicketsCount(resolved)
                .awaitingFeedbackCount(awaitingFeedback)
                .build());
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userRepository.findById(user.getId()).orElse(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<EmployeeResponse> updateProfile(
            @Valid @RequestBody UpdateAdminProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.updateProfile(user.getId(), request));
    }

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

    @GetMapping("/feedback")
    public ResponseEntity<CustomerFeedbackSummaryResponse> getMyFeedback(@AuthenticationPrincipal User user) {
        List<Feedback> feedbackList = feedbackRepository.findByCustomerId(user.getId());
        
        double avgRating = 0.0;
        if (!feedbackList.isEmpty()) {
            avgRating = feedbackList.stream().mapToInt(Feedback::getRating).average().orElse(0.0);
        }
        
        List<CustomerFeedbackResponse> list = feedbackList.stream().map(f -> CustomerFeedbackResponse.builder()
                .id(f.getId())
                .ticketId(f.getTicket().getId())
                .ticketTitle(f.getTicket().getTitle())
                .rating(f.getRating())
                .comment(f.getComment())
                .createdAt(f.getCreatedAt())
                .build()).collect(Collectors.toList());
                
        return ResponseEntity.ok(CustomerFeedbackSummaryResponse.builder()
                .feedbackList(list)
                .averageRating(avgRating)
                .totalFeedbackCount(list.size())
                .build());
    }
}
