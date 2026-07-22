package com.meritdesk.controller;

import com.meritdesk.dto.request.*;
import com.meritdesk.dto.response.ApiResponse;
import com.meritdesk.dto.response.AuthResponse;
import com.meritdesk.dto.response.CompanyResponse;
import com.meritdesk.service.AuthService;
import com.meritdesk.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CompanyService companyService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register-company")
    public ResponseEntity<ApiResponse> registerCompany(@Valid @RequestBody CompanyRegistrationRequest request) {
        AuthResponse response = authService.registerCompany(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Company registration submitted. Please wait for platform admin approval.", response));
    }

    @PostMapping("/register-customer")
    public ResponseEntity<AuthResponse> registerCustomer(@Valid @RequestBody CustomerRegistrationRequest request) {
        return ResponseEntity.ok(authService.registerCustomer(request));
    }

    @PostMapping("/set-password")
    public ResponseEntity<AuthResponse> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        return ResponseEntity.ok(authService.setPassword(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("If an account exists for that email, a password reset link has been sent.", null));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<ApiResponse> verifyResetOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyPasswordResetToken(request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request.getToken(), request.getPassword()));
    }

    @GetMapping("/active-companies")
    public ResponseEntity<List<CompanyResponse>> getActiveCompanies() {
        return ResponseEntity.ok(companyService.getActiveCompanies());
    }
}
