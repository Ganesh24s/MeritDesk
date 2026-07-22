package com.meritdesk.service;

import com.meritdesk.entity.Company;
import com.meritdesk.entity.Subscription;
import com.meritdesk.repository.CompanyRepository;
import com.meritdesk.repository.SubscriptionRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class PaymentService {

    private final SubscriptionRepository subscriptionRepository;
    private final CompanyRepository companyRepository;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    public void init() {
        try {
            razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        } catch (RazorpayException e) {
            log.error("Failed to initialize RazorpayClient", e);
        }
    }

    @Transactional
    public String createOrder(Long companyId) throws RazorpayException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        Subscription sub = subscriptionRepository.findByCompanyId(companyId)
                .orElseGet(() -> {
                    Subscription newSub = Subscription.builder()
                            .company(company)
                            .build();
                    return subscriptionRepository.save(newSub);
                });

        if ("ACTIVE".equals(sub.getStatus()) && "ENTERPRISE".equals(sub.getPlanId())) {
            throw new RuntimeException("Company is already on the Enterprise plan");
        }

        // Amount in paise (₹299 = 29900 paise)
        int amountInPaise = 29900;

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());
        orderRequest.put("notes", new JSONObject().put("company_id", companyId.toString()));

        Order order = razorpayClient.orders.create(orderRequest);
        String orderId = order.get("id");

        // Save order ID to subscription
        sub.setRazorpayOrderId(orderId);
        subscriptionRepository.save(sub);

        return orderId;
    }

    @Transactional
    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature, Long companyId) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            boolean isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);

            if (isValid) {
                Subscription sub = subscriptionRepository.findByCompanyId(companyId)
                        .orElseThrow(() -> new RuntimeException("Subscription not found"));

                // Ensure the order matches what we saved
                if (razorpayOrderId.equals(sub.getRazorpayOrderId())) {
                    sub.setRazorpayPaymentId(razorpayPaymentId);
                    sub.setPlanId("ENTERPRISE");
                    sub.setStatus("ACTIVE");
                    sub.setCurrentPeriodEnd(LocalDateTime.now().plusDays(30)); // Give 30 days access
                    subscriptionRepository.save(sub);
                    log.info("Company {} successfully upgraded to Enterprise via Razorpay", companyId);
                    return true;
                }
            }
            
            return false;
        } catch (RazorpayException e) {
            log.error("Failed to verify Razorpay signature", e);
            return false;
        }
    }

    public Subscription getCompanySubscription(Long companyId) {
        return subscriptionRepository.findByCompanyId(companyId)
                .orElseGet(() -> Subscription.builder()
                        .planId("STARTER")
                        .status("ACTIVE")
                        .build());
    }
}
