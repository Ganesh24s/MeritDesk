package com.meritdesk.entity;

import com.meritdesk.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"email"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Department department;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    // Employee-specific fields
    @Builder.Default
    private double honourScore = 100.0;

    @Builder.Default
    private boolean available = true;

    @Builder.Default
    private String availabilityStatus = "ONLINE";

    @Builder.Default
    private int maxCapacity = 20;

    public String getAvailabilityStatus() {
        return availabilityStatus == null ? "ONLINE" : availabilityStatus;
    }

    private String phone;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "employee_skills",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<Skill> skills = new HashSet<>();

    @Builder.Default
    private boolean emailNotifySlaBreach = true;

    @Builder.Default
    private boolean emailNotifyEscalation = true;

    @Builder.Default
    private boolean emailNotifyExtensionRequest = true;

    @Builder.Default
    private boolean emailNotifySystemAlert = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
