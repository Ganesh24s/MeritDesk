package com.meritdesk.service;

import com.meritdesk.dto.request.CreateDepartmentRequest;
import com.meritdesk.dto.request.UpdateEmployeeRequest;
import com.meritdesk.dto.response.DepartmentResponse;
import com.meritdesk.dto.response.EmployeeResponse;
import com.meritdesk.dto.response.SkillResponse;
import com.meritdesk.entity.*;
import com.meritdesk.enums.HonourLevel;
import com.meritdesk.enums.Role;
import com.meritdesk.enums.TicketStatus;
import com.meritdesk.exception.BadRequestException;
import com.meritdesk.exception.ResourceNotFoundException;
import com.meritdesk.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final SkillRepository skillRepository;
    private final InvitationTokenRepository invitationTokenRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final FeedbackRepository feedbackRepository;
    private final AssignmentHistoryRepository assignmentHistoryRepository;
    private final HonourScoreHistoryRepository honourScoreHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request, User admin) {
        Long companyId = admin.getCompany().getId();

        if (departmentRepository.existsByNameAndCompanyId(request.getName(), companyId)) {
            throw new BadRequestException("Department with this name already exists");
        }

        Department dept = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .company(admin.getCompany())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 100)
                .build();
        dept = departmentRepository.save(dept);

        return toResponse(dept);
    }

    public List<DepartmentResponse> getDepartmentsByCompany(Long companyId) {
        return departmentRepository.findByCompanyId(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DepartmentResponse getDepartment(Long id, Long companyId) {
        Department dept = departmentRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        return toResponse(dept);
    }

    @Transactional
    public DepartmentResponse updateDepartment(Long id, CreateDepartmentRequest request, Long companyId) {
        Department dept = departmentRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        dept.setName(request.getName());
        if (request.getDescription() != null) dept.setDescription(request.getDescription());
        if (request.getCapacity() != null) dept.setCapacity(request.getCapacity());

        dept = departmentRepository.save(dept);
        return toResponse(dept);
    }

    @Transactional
    public void deleteDepartment(Long id, Long companyId) {
        Department dept = departmentRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        // Unlink users from this department
        List<User> users = userRepository.findByDepartmentId(id);
        for (User user : users) {
            user.setDepartment(null);
            userRepository.save(user);
        }

        // Unlink tickets from this department
        List<Ticket> tickets = ticketRepository.findByDepartmentId(id);
        for (Ticket ticket : tickets) {
            ticket.setDepartment(null);
            ticketRepository.save(ticket);
        }

        // Unlink invitation tokens from this department
        List<InvitationToken> tokens = invitationTokenRepository.findByDepartmentId(id);
        for (InvitationToken token : tokens) {
            token.setDepartment(null);
            invitationTokenRepository.save(token);
        }

        departmentRepository.delete(dept);
    }

    public List<EmployeeResponse> getEmployeesByCompany(Long companyId) {
        List<Role> roles = List.of(Role.EMPLOYEE, Role.DEPARTMENT_ADMIN);
        return userRepository.findByCompanyIdAndRoleIn(companyId, roles).stream()
                .map(this::toEmployeeResponse)
                .collect(Collectors.toList());
    }

    public List<EmployeeResponse> getEmployeesByDepartment(Long departmentId) {
        List<Role> roles = List.of(Role.EMPLOYEE, Role.DEPARTMENT_ADMIN);
        return userRepository.findByDepartmentIdAndRoleIn(departmentId, roles).stream()
                .map(this::toEmployeeResponse)
                .collect(Collectors.toList());
    }

    public EmployeeResponse getEmployee(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        return toEmployeeResponse(user);
    }

    @Transactional
    public void toggleEmployeeAvailability(Long employeeId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        boolean newAvailable = !user.isAvailable();
        user.setAvailable(newAvailable);
        user.setAvailabilityStatus(newAvailable ? "ONLINE" : "OFFLINE");
        userRepository.save(user);
    }

    @Transactional
    public void updateEmployeeAvailability(Long employeeId, String status) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        String upperStatus = status.toUpperCase();
        if (!upperStatus.equals("ONLINE") && !upperStatus.equals("OFFLINE") && !upperStatus.equals("BUSY")) {
            throw new BadRequestException("Invalid availability status: " + status);
        }
        user.setAvailabilityStatus(upperStatus);
        user.setAvailable(!upperStatus.equals("OFFLINE"));
        userRepository.save(user);
    }

    @Transactional
    public void unassignActiveEmployeeTickets(Long employeeId) {
        List<Ticket> assignedTickets = ticketRepository.findByAssignedToId(employeeId);
        for (Ticket ticket : assignedTickets) {
            if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED) {
                ticket.setAssignedTo(null);
                ticket.setStatus(TicketStatus.OPEN);
                ticket.setAssignmentReasoning("Unassigned due to employee deactivation");
                ticketRepository.save(ticket);

                TicketHistory history = TicketHistory.builder()
                        .ticket(ticket)
                        .status(TicketStatus.OPEN)
                        .comment("Unassigned due to employee deactivation")
                        .build();
                ticketHistoryRepository.save(history);
            }
        }
    }

    @Transactional
    public void deactivateEmployee(Long employeeId, Long companyId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        if (user.getCompany() == null || !user.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Employee does not belong to your company");
        }
        user.setActive(false);
        userRepository.save(user);

        unassignActiveEmployeeTickets(employeeId);
    }

    @Transactional
    public void activateEmployee(Long employeeId, Long companyId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        if (user.getCompany() == null || !user.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Employee does not belong to your company");
        }
        user.setActive(true);
        userRepository.save(user);
    }

    @Transactional
    public void deleteEmployee(Long employeeId, Long companyId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        if (user.getCompany() == null || !user.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Employee does not belong to your company");
        }

        // 1. Unassign tickets assigned to this employee
        unassignActiveEmployeeTickets(employeeId);

        // 2. Handle tickets raised by this employee
        List<Ticket> raisedTickets = ticketRepository.findByRaisedById(employeeId);
        for (Ticket ticket : raisedTickets) {
            ticketHistoryRepository.deleteByTicketId(ticket.getId());
            feedbackRepository.findByTicketId(ticket.getId()).ifPresent(feedbackRepository::delete);
            assignmentHistoryRepository.findByTicketId(ticket.getId()).forEach(assignmentHistoryRepository::delete);
            ticketRepository.delete(ticket);
        }

        // 3. Delete assignment history & honour history for this employee
        List<AssignmentHistory> assignments = assignmentHistoryRepository.findByEmployeeIdOrderByAssignedAtDesc(employeeId);
        assignmentHistoryRepository.deleteAll(assignments);
        honourScoreHistoryRepository.deleteByEmployeeId(employeeId);

        // 4. Delete notifications, audit logs & reset tokens for this employee
        notificationRepository.deleteByUserId(employeeId);
        auditLogRepository.deleteByUserId(employeeId);
        passwordResetTokenRepository.deleteByUserId(employeeId);

        // 5. Clear skills
        user.getSkills().clear();
        userRepository.save(user);

        // 6. Delete the employee user record
        userRepository.delete(user);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long employeeId, UpdateEmployeeRequest request, Long companyId) {
        User user = userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        if (user.getCompany() == null || !user.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Employee does not belong to your company");
        }

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setMaxCapacity(request.getMaxCapacity());
        user.setActive(request.isActive());

        if (!request.isActive()) {
            unassignActiveEmployeeTickets(employeeId);
        }

        if (request.getRole() != null) {
            Role newRole = Role.valueOf(request.getRole().toUpperCase());
            if (newRole != Role.EMPLOYEE && newRole != Role.DEPARTMENT_ADMIN) {
                throw new BadRequestException("Invalid role");
            }
            user.setRole(newRole);
        }

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findByIdAndCompanyId(request.getDepartmentId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found in company"));
            user.setDepartment(dept);
        } else {
            user.setDepartment(null);
        }

        if (request.getSkillIds() != null) {
            List<Skill> skills = skillRepository.findAllById(request.getSkillIds());
            user.setSkills(new HashSet<>(skills));
        }

        user = userRepository.save(user);
        return toEmployeeResponse(user);
    }

    private DepartmentResponse toResponse(Department dept) {
        int load = ticketRepository.sumWorkloadWeightByDepartment(dept.getId());
        long empCount = userRepository.findByDepartmentIdAndRoleIn(
                dept.getId(), List.of(Role.EMPLOYEE, Role.DEPARTMENT_ADMIN)).stream()
                .filter(User::isActive)
                .count();
        
        List<Ticket> deptTickets = ticketRepository.findByDepartmentId(dept.getId());
        long ticketCount = deptTickets.size();
        
        long activeCount = deptTickets.stream()
                .filter(t -> t.getStatus() != TicketStatus.RESOLVED && t.getStatus() != TicketStatus.CLOSED)
                .count();
                
        List<Ticket> resolved = deptTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED || t.getStatus() == TicketStatus.CLOSED)
                .collect(Collectors.toList());
                
        long compliant = resolved.stream()
                .filter(t -> !t.isSlaResolutionBreached())
                .count();
                
        double compliance = resolved.isEmpty() ? 100.0 : ((double) compliant / resolved.size()) * 100.0;

        return DepartmentResponse.builder()
                .id(dept.getId())
                .name(dept.getName())
                .description(dept.getDescription())
                .capacity(dept.getCapacity())
                .currentLoad(load)
                .employeeCount(empCount)
                .ticketCount(ticketCount)
                .activeTickets(activeCount)
                .slaComplianceRate(compliance)
                .active(true)
                .build();
    }

    private EmployeeResponse toEmployeeResponse(User user) {
        int workload = ticketRepository.sumWorkloadWeightByEmployee(user.getId());
        List<SkillResponse> skills = user.getSkills().stream()
                .map(s -> SkillResponse.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .category(s.getCategory())
                        .build())
                .collect(Collectors.toList());

        return EmployeeResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .honourScore(user.getHonourScore())
                .honourLevel(HonourLevel.fromScore(user.getHonourScore()).getDisplayName())
                .available(user.isAvailable())
                .availabilityStatus(user.getAvailabilityStatus())
                .maxCapacity(user.getMaxCapacity())
                .currentWorkload(workload)
                .active(user.isActive())
                .skills(skills)
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public void seedSampleDataForCompany(Company company) {
        String domain = company.getEmail().contains("@") ? company.getEmail().split("@")[1] : "meritcorp.com";

        // 1. Department 1: Customer Support
        Department support = departmentRepository.findByCompanyId(company.getId()).stream()
                .filter(d -> d.getName().equalsIgnoreCase("Customer Support"))
                .findFirst()
                .orElseGet(() -> departmentRepository.save(Department.builder()
                        .name("Customer Support")
                        .description("Handles general customer inquiries, tickets, and resolution support")
                        .capacity(100)
                        .company(company)
                        .build()));

        String supportAdminEmail = "support.admin@" + domain;
        if (!userRepository.existsByEmail(supportAdminEmail)) {
            userRepository.save(User.builder()
                    .name("Sarah Connor (Dept Admin)")
                    .email(supportAdminEmail)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.DEPARTMENT_ADMIN)
                    .company(company)
                    .department(support)
                    .active(true)
                    .available(true)
                    .honourScore(120.0)
                    .maxCapacity(25)
                    .build());
        }

        String supportEmp1 = "john.support@" + domain;
        if (!userRepository.existsByEmail(supportEmp1)) {
            userRepository.save(User.builder()
                    .name("John Doe")
                    .email(supportEmp1)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.EMPLOYEE)
                    .company(company)
                    .department(support)
                    .active(true)
                    .available(true)
                    .honourScore(100.0)
                    .maxCapacity(20)
                    .build());
        }

        String supportEmp2 = "jane.support@" + domain;
        if (!userRepository.existsByEmail(supportEmp2)) {
            userRepository.save(User.builder()
                    .name("Jane Smith")
                    .email(supportEmp2)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.EMPLOYEE)
                    .company(company)
                    .department(support)
                    .active(true)
                    .available(true)
                    .honourScore(105.0)
                    .maxCapacity(20)
                    .build());
        }

        // 2. Department 2: Software Engineering
        Department eng = departmentRepository.findByCompanyId(company.getId()).stream()
                .filter(d -> d.getName().equalsIgnoreCase("Software Engineering"))
                .findFirst()
                .orElseGet(() -> departmentRepository.save(Department.builder()
                        .name("Software Engineering")
                        .description("Handles technical bug resolution, core platform development, and architecture")
                        .capacity(120)
                        .company(company)
                        .build()));

        String engAdminEmail = "eng.admin@" + domain;
        if (!userRepository.existsByEmail(engAdminEmail)) {
            userRepository.save(User.builder()
                    .name("Alex Murphy (Dept Admin)")
                    .email(engAdminEmail)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.DEPARTMENT_ADMIN)
                    .company(company)
                    .department(eng)
                    .active(true)
                    .available(true)
                    .honourScore(130.0)
                    .maxCapacity(30)
                    .build());
        }

        String engEmp1 = "michael.eng@" + domain;
        if (!userRepository.existsByEmail(engEmp1)) {
            userRepository.save(User.builder()
                    .name("Michael Scott")
                    .email(engEmp1)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.EMPLOYEE)
                    .company(company)
                    .department(eng)
                    .active(true)
                    .available(true)
                    .honourScore(110.0)
                    .maxCapacity(20)
                    .build());
        }

        String engEmp2 = "pam.eng@" + domain;
        if (!userRepository.existsByEmail(engEmp2)) {
            userRepository.save(User.builder()
                    .name("Pam Beesly")
                    .email(engEmp2)
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.EMPLOYEE)
                    .company(company)
                    .department(eng)
                    .active(true)
                    .available(true)
                    .honourScore(115.0)
                    .maxCapacity(20)
                    .build());
        }
    }
}
