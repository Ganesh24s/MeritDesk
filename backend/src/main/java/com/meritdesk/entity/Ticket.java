package com.meritdesk.entity;

import com.meritdesk.enums.TicketPriority;
import com.meritdesk.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    private String category;

    // Comma-separated required skill names for matching
    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raised_by_id", nullable = false)
    private User raisedBy;

    private LocalDateTime slaResponseDeadline;
    private LocalDateTime slaResolutionDeadline;

    @Builder.Default
    private boolean slaResponseBreached = false;

    @Builder.Default
    private boolean slaResolutionBreached = false;

    @Builder.Default
    private boolean inOverflow = false;

    private String assignmentReasoning;

    @Builder.Default
    private boolean escalated = false;

    @Builder.Default
    private boolean extensionRequested = false;

    private String extensionReason;

    private LocalDateTime extensionRequestedDeadline;

    private LocalDateTime lastUpdatedByEmployee;

    private LocalDateTime assignedAt;

    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
