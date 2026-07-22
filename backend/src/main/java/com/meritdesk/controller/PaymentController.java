package com.meritdesk.controller;

import com.meritdesk.dto.response.ApiResponse;
import com.meritdesk.entity.User;
import com.meritdesk.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ResponseEntity<ApiResponse> createOrder(@AuthenticationPrincipal User admin) {
        try {
            if (admin.getCompany() == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Admin is not associated with a company"));
            }
            
            String orderId = paymentService.createOrder(admin.getCompany().getId());
            return ResponseEntity.ok(ApiResponse.success("Order created", Map.of("orderId", orderId)));
        } catch (Exception e) {
            log.error("Failed to create Razorpay order", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ResponseEntity<ApiResponse> verifyPayment(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User admin) {
        try {
            String razorpayOrderId = payload.get("razorpay_order_id");
            String razorpayPaymentId = payload.get("razorpay_payment_id");
            String razorpaySignature = payload.get("razorpay_signature");

            boolean isValid = paymentService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, admin.getCompany().getId());

            if (isValid) {
                return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", null));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid payment signature"));
            }
        } catch (Exception e) {
            log.error("Payment verification failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Verification failed"));
        }
    }

    @GetMapping("/subscription")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ResponseEntity<ApiResponse> getSubscriptionStatus(@AuthenticationPrincipal User admin) {
        if (admin.getCompany() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Admin is not associated with a company"));
        }
        return ResponseEntity.ok(ApiResponse.success("Subscription fetched", paymentService.getCompanySubscription(admin.getCompany().getId())));
    }
}
