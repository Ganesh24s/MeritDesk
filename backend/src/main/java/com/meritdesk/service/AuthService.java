package com.meritdesk.service;

import com.meritdesk.config.JwtTokenProvider;
import com.meritdesk.dto.request.*;
import com.meritdesk.dto.response.AuthResponse;
import com.meritdesk.dto.response.EmployeeResponse;
import com.meritdesk.exception.ResourceNotFoundException;
import com.meritdesk.entity.*;
import com.meritdesk.enums.CompanyStatus;
import com.meritdesk.enums.Role;
import com.meritdesk.exception.BadRequestException;
import com.meritdesk.exception.UnauthorizedException;
import com.meritdesk.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final InvitationTokenRepository invitationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final AuditService auditService;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("Your account has been deactivated");
        }

        // Check if the user's company is active (for non-super-admins)
        if (user.getRole() != Role.SUPER_ADMIN && user.getCompany() != null) {
            if (user.getCompany().getStatus() != CompanyStatus.ACTIVE) {
                throw new UnauthorizedException("Your company account is not active. Current status: " + user.getCompany().getStatus());
            }
        }

        Long companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name(), companyId);

        auditService.log(user, "LOGIN", "User logged in", "User", user.getId());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .companyId(companyId)
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .build();
    }

    @Transactional
    public AuthResponse registerCompany(CompanyRegistrationRequest request) {
        if (companyRepository.existsByEmail(request.getCompanyEmail())) {
            throw new BadRequestException("A company with this email already exists");
        }

        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new BadRequestException("A user with this admin email already exists");
        }

        // Create company with PENDING status
        Company company = Company.builder()
                .name(request.getCompanyName())
                .email(request.getCompanyEmail())
                .status(CompanyStatus.PENDING)
                .industry(request.getIndustry())
                .address(request.getAddress())
                .size(request.getSize())
                .adminName(request.getAdminName())
                .adminEmail(request.getAdminEmail())
                .logoUrl(request.getLogoUrl())
                .website(request.getWebsite())
                .build();
        company = companyRepository.save(company);

        // Create the company admin user
        User admin = User.builder()
                .name(request.getAdminName())
                .email(request.getAdminEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.COMPANY_ADMIN)
                .company(company)
                .active(true)
                .build();
        admin = userRepository.save(admin);

        log.info("New company registered: {} (PENDING approval)", company.getName());

        return AuthResponse.builder()
                .userId(admin.getId())
                .email(admin.getEmail())
                .name(admin.getName())
                .role(admin.getRole().name())
                .companyId(company.getId())
                .companyName(company.getName())
                .build();
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with that email address"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        String token = String.format("%06d", new Random().nextInt(999999));
        
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(2))
                .build();
                
        passwordResetTokenRepository.save(resetToken);
        
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
        auditService.log(user, "PASSWORD_RESET_REQUESTED", "Password reset email sent to " + user.getEmail(), "User", user.getId());
    }

    @Transactional(readOnly = true)
    public void verifyPasswordResetToken(String token) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (resetToken.isUsed()) {
            throw new BadRequestException("This reset link has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This reset link has expired");
        }
    }

    @Transactional
    public AuthResponse resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        if (resetToken.isUsed()) {
            throw new BadRequestException("This reset link has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This reset link has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        auditService.log(user, "PASSWORD_RESET_COMPLETED", "Password was successfully reset", "User", user.getId());

        Long companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name(), companyId);

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .companyId(companyId)
                .companyName(user.getCompany() != null ? user.getCompany().getName() : null)
                .build();
    }

    @Transactional
    public AuthResponse registerCustomer(CustomerRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A user with this email already exists");
        }

        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new BadRequestException("Company not found"));

        if (company.getStatus() != CompanyStatus.ACTIVE) {
            throw new BadRequestException("This company is not currently active");
        }

        User customer = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .company(company)
                .phone(request.getPhone())
                .active(true)
                .build();
        customer = userRepository.save(customer);

        Long companyId = company.getId();
        String token = jwtTokenProvider.generateToken(customer.getId(), customer.getEmail(), 
                customer.getRole().name(), companyId);

        log.info("New customer registered: {} for company {}", customer.getEmail(), company.getName());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(customer.getId())
                .email(customer.getEmail())
                .name(customer.getName())
                .role(customer.getRole().name())
                .companyId(companyId)
                .companyName(company.getName())
                .build();
    }

    @Transactional
    public void inviteEmployee(InviteEmployeeRequest request, User companyAdmin) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A user with this email already exists");
        }

        Department department = departmentRepository.findByIdAndCompanyId(
                request.getDepartmentId(), companyAdmin.getCompany().getId())
                .orElseThrow(() -> new BadRequestException("Department not found in your company"));

        Role role = Role.valueOf(request.getRole().toUpperCase());
        if (role != Role.EMPLOYEE && role != Role.DEPARTMENT_ADMIN) {
            throw new BadRequestException("Invalid role. Must be EMPLOYEE or DEPARTMENT_ADMIN");
        }

        // Generate invitation token
        String token = UUID.randomUUID().toString();
        String skillIds = request.getSkillIds() != null 
                ? request.getSkillIds().stream().map(String::valueOf).collect(Collectors.joining(","))
                : null;

        InvitationToken invitation = InvitationToken.builder()
                .token(token)
                .email(request.getEmail())
                .name(request.getName())
                .role(role)
                .company(companyAdmin.getCompany())
                .department(department)
                .skillIds(skillIds)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .build();
        invitationTokenRepository.save(invitation);

        // Send email
        emailService.sendInvitationEmail(request.getEmail(), request.getName(), token);

        auditService.log(companyAdmin, "INVITE_EMPLOYEE", 
                String.format("Invited %s (%s) as %s to dept %s", 
                        request.getName(), request.getEmail(), role, department.getName()),
                "InvitationToken", invitation.getId());

        log.info("Employee invitation sent: {} -> {} as {}", 
                request.getEmail(), department.getName(), role);
    }

    @Transactional
    public AuthResponse setPassword(SetPasswordRequest request) {
        InvitationToken invitation = invitationTokenRepository.findByTokenAndUsedFalse(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired invitation token"));

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invitation token has expired");
        }

        if (userRepository.existsByEmail(invitation.getEmail())) {
            throw new BadRequestException("A user with this email already exists");
        }

        // Create the user
        User user = User.builder()
                .name(invitation.getName())
                .email(invitation.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(invitation.getRole())
                .company(invitation.getCompany())
                .department(invitation.getDepartment())
                .active(true)
                .honourScore(100.0)
                .available(true)
                .maxCapacity(20)
                .build();

        // Assign skills
        if (invitation.getSkillIds() != null && !invitation.getSkillIds().isBlank()) {
            List<Long> skillIds = Arrays.stream(invitation.getSkillIds().split(","))
                    .map(Long::parseLong)
                    .toList();
            Set<Skill> skills = new HashSet<>(skillRepository.findByIdIn(skillIds));
            user.setSkills(skills);
        }

        user = userRepository.save(user);

        // Mark invitation as used
        invitation.setUsed(true);
        invitationTokenRepository.save(invitation);

        // Generate token and return
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), 
                user.getRole().name(), user.getCompany().getId());

        log.info("Password set for invited user: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .companyId(user.getCompany().getId())
                .companyName(user.getCompany().getName())
                .build();
    }

    @Transactional
    public EmployeeResponse updateProfile(Long userId, UpdateAdminProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);

        return EmployeeResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.isActive())
                .build();
    }
}
