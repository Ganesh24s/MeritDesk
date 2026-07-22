package com.meritdesk.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Company company;

    private String razorpayOrderId;

    private String razorpayPaymentId;

    @Column(nullable = false)
    @Builder.Default
    private String planId = "STARTER"; // STARTER, ENTERPRISE

    @Column(nullable = false)
    @Builder.Default
    private String status = "TRIALING"; // TRIALING, ACTIVE, PAST_DUE, CANCELED

    private LocalDateTime currentPeriodEnd;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
