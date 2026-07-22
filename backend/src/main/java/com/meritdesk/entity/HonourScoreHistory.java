package com.meritdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "honour_score_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HonourScoreHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @Column(nullable = false)
    private double changeAmount;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private double scoreAfterChange;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
