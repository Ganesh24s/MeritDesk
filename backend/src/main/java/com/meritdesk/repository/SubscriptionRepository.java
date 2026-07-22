package com.meritdesk.repository;

import com.meritdesk.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByCompanyId(Long companyId);
    Optional<Subscription> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Subscription> findByRazorpayPaymentId(String razorpayPaymentId);
}
