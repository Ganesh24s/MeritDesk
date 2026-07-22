package com.meritdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private String type; // ASSIGNMENT, SLA_WARNING, ESCALATION, FEEDBACK, etc.

    @Builder.Default
    @Column(name = "is_read")
    private boolean read = false;

    private String link; // optional link to relevant page

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
