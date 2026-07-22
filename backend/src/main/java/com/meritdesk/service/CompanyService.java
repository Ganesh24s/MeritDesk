package com.meritdesk.service;

import com.meritdesk.dto.request.UpdateCompanySettingsRequest;
import com.meritdesk.dto.response.*;
import com.meritdesk.entity.*;
import com.meritdesk.enums.CompanyStatus;
import com.meritdesk.enums.HonourLevel;
import com.meritdesk.enums.Role;
import com.meritdesk.exception.BadRequestException;
import com.meritdesk.exception.ResourceNotFoundException;
import com.meritdesk.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final DepartmentRepository departmentRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final SkillRepository skillRepository;
    private final InvitationTokenRepository invitationTokenRepository;
    private final KnowledgeBaseArticleRepository knowledgeBaseArticleRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final FeedbackRepository feedbackRepository;
    private final AssignmentHistoryRepository assignmentHistoryRepository;
    private final HonourScoreHistoryRepository honourScoreHistoryRepository;
    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentService departmentService;

    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CompanyResponse> getCompaniesByStatus(CompanyStatus status) {
        return companyRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CompanyResponse> getActiveCompanies() {
        return getCompaniesByStatus(CompanyStatus.ACTIVE);
    }

    public CompanyResponse getCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse approveCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        if (company.getStatus() != CompanyStatus.PENDING) {
            throw new BadRequestException("Company is not in PENDING status");
        }

        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        log.info("Company approved: {}", company.getName());
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse rejectCompany(Long id, String reason) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        if (company.getStatus() != CompanyStatus.PENDING) {
            throw new BadRequestException("Company is not in PENDING status");
        }

        company.setStatus(CompanyStatus.REJECTED);
        company.setRejectionReason(reason);
        companyRepository.save(company);

        log.info("Company rejected: {} - Reason: {}", company.getName(), reason);
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse suspendCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        company.setStatus(CompanyStatus.SUSPENDED);
        companyRepository.save(company);

        log.info("Company suspended: {}", company.getName());
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse activateCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        company.setStatus(CompanyStatus.ACTIVE);
        companyRepository.save(company);

        log.info("Company activated: {}", company.getName());
        return toResponse(company);
    }

    @Transactional
    public void deleteCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        if (company.getStatus() != CompanyStatus.SUSPENDED && company.getStatus() != CompanyStatus.REJECTED) {
            throw new BadRequestException("Only suspended or rejected companies can be deleted.");
        }

        // 1. Delete all tickets and related history, feedback, assignment history
        List<Ticket> tickets = ticketRepository.findByCompanyId(companyId);
        for (Ticket ticket : tickets) {
            ticketHistoryRepository.deleteByTicketId(ticket.getId());
            feedbackRepository.findByTicketId(ticket.getId()).ifPresent(feedbackRepository::delete);
            assignmentHistoryRepository.findByTicketId(ticket.getId()).forEach(assignmentHistoryRepository::delete);
        }
        ticketRepository.deleteAll(tickets);

        // 2. Delete all users/members belonging to this company (employees, admins, customers)
        List<User> users = userRepository.findByCompanyId(companyId);
        for (User user : users) {
            user.getSkills().clear();
            userRepository.save(user);
            notificationRepository.deleteByUserId(user.getId());
            honourScoreHistoryRepository.deleteByEmployeeId(user.getId());
            auditLogRepository.deleteByUserId(user.getId());
            passwordResetTokenRepository.deleteByUserId(user.getId());
        }
        userRepository.deleteAll(users);

        // 3. Delete invitation tokens
        List<InvitationToken> tokens = invitationTokenRepository.findByCompanyId(companyId);
        invitationTokenRepository.deleteAll(tokens);

        // 4. Delete KB Articles
        List<KnowledgeBaseArticle> kbArticles = knowledgeBaseArticleRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        knowledgeBaseArticleRepository.deleteAll(kbArticles);

        // 5. Delete SLA Policies
        List<SLAPolicy> slaPolicies = slaPolicyRepository.findByCompanyId(companyId);
        slaPolicyRepository.deleteAll(slaPolicies);

        // 6. Delete Skills
        List<Skill> skills = skillRepository.findByCompanyId(companyId);
        skillRepository.deleteAll(skills);

        // 7. Delete Departments
        List<Department> departments = departmentRepository.findByCompanyId(companyId);
        departmentRepository.deleteAll(departments);

        // 8. Delete Subscription if exists
        subscriptionRepository.findByCompanyId(companyId).ifPresent(subscriptionRepository::delete);

        // 9. Delete Company record
        companyRepository.delete(company);
        log.info("Company deleted along with all members and data: {}", company.getName());
    }

    @Transactional
    public CompanyResponse updateCompanySettings(Long companyId, UpdateCompanySettingsRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        company.setName(request.getName());
        if (request.getLogoUrl() != null) company.setLogoUrl(request.getLogoUrl());
        if (request.getWebsite() != null) company.setWebsite(request.getWebsite());
        if (request.getAddress() != null) company.setAddress(request.getAddress());
        if (request.getIndustry() != null) company.setIndustry(request.getIndustry());

        company = companyRepository.save(company);
        return toResponse(company);
    }

    public DashboardStatsResponse getPlatformStats() {
        long totalCompanies = companyRepository.count();
        long activeCompanies = companyRepository.findByStatus(CompanyStatus.ACTIVE).size();
        long pendingCompanies = companyRepository.findByStatus(CompanyStatus.PENDING).size();
        long totalTickets = ticketRepository.count();
        long openTickets = ticketRepository.findAll().stream()
                .filter(t -> t.getStatus() != com.meritdesk.enums.TicketStatus.RESOLVED && t.getStatus() != com.meritdesk.enums.TicketStatus.CLOSED)
                .count();
        long totalEmployees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE || u.getRole() == Role.DEPARTMENT_ADMIN).count();
        long totalCustomers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.CUSTOMER).count();

        return DashboardStatsResponse.builder()
                .totalCompanies(totalCompanies)
                .activeCompanies(activeCompanies)
                .pendingCompanies(pendingCompanies)
                .totalTickets(totalTickets)
                .openTickets(openTickets)
                .totalEmployees(totalEmployees)
                .totalCustomers(totalCustomers)
                .build();
    }

    public DashboardStatsResponse getCompanyStats(Long companyId) {
        long totalTickets = ticketRepository.countByCompanyId(companyId);
        long totalEmployees = userRepository.findByCompanyId(companyId).stream()
                .filter(u -> u.isActive() && (u.getRole() == Role.EMPLOYEE || u.getRole() == Role.DEPARTMENT_ADMIN))
                .count();
        long totalCustomers = userRepository.findByCompanyId(companyId).stream()
                .filter(u -> u.isActive() && u.getRole() == Role.CUSTOMER)
                .count();
        long totalDepartments = departmentRepository.findByCompanyId(companyId).size();

        long resolved = ticketRepository.countResolvedByCompany(companyId);
        long compliant = ticketRepository.countSlaCompliantByCompany(companyId);
        double slaCompliance = resolved > 0 ? ((double) compliant / resolved) * 100 : 100.0;

        List<Ticket> allTickets = ticketRepository.findByCompanyId(companyId);
        long activeCount = allTickets.stream()
                .filter(t -> t.getStatus() != com.meritdesk.enums.TicketStatus.RESOLVED && t.getStatus() != com.meritdesk.enums.TicketStatus.CLOSED)
                .count();

        Map<String, Long> ticketsByPriority = new HashMap<>();
        ticketRepository.countByCompanyGroupedByPriority(companyId)
                .forEach(row -> {
                    if (row[0] != null && row[1] != null) {
                        ticketsByPriority.put(row[0].toString(), (Long) row[1]);
                    }
                });

        Map<String, Long> ticketsByStatus = new HashMap<>();
        ticketRepository.countByCompanyGroupedByStatus(companyId)
                .forEach(row -> {
                    if (row[0] != null && row[1] != null) {
                        ticketsByStatus.put(row[0].toString(), (Long) row[1]);
                    }
                });

        // SLA Breaches by Department
        List<Ticket> breached = allTickets.stream()
                .filter(t -> t.isSlaResponseBreached() || t.isSlaResolutionBreached())
                .collect(Collectors.toList());

        Map<String, Long> breachesByDept = new HashMap<>();
        for (Ticket t : breached) {
            String deptName = t.getDepartment() != null ? t.getDepartment().getName() : "Unassigned";
            breachesByDept.put(deptName, breachesByDept.getOrDefault(deptName, 0L) + 1);
        }

        // Leaderboard: Top 5 Employees
        List<EmployeeResponse> topEmployees = userRepository.findEmployeesByCompanyOrderByHonour(companyId).stream()
                .limit(5)
                .map(this::toEmployeeResponse)
                .collect(Collectors.toList());

        // Recent Activity
        List<RecentActivityResponse> recentActivity = new ArrayList<>();
        List<Ticket> recentTickets = allTickets.stream()
                .sorted(Comparator.comparing((Ticket t) -> t.getUpdatedAt() != null ? t.getUpdatedAt() : (t.getCreatedAt() != null ? t.getCreatedAt() : LocalDateTime.MIN)).reversed())
                .limit(10)
                .collect(Collectors.toList());

        for (Ticket t : recentTickets) {
            String message;
            String type;
            if (t.isEscalated()) {
                message = "Ticket #" + t.getId() + " was escalated to CRITICAL priority";
                type = "ESCALATION";
            } else if (t.isSlaResolutionBreached() || t.isSlaResponseBreached()) {
                message = "SLA Breach on ticket #" + t.getId() + ": " + t.getTitle();
                type = "SLA_BREACH";
            } else if (t.getStatus() == com.meritdesk.enums.TicketStatus.RESOLVED) {
                message = "Ticket #" + t.getId() + " resolved by " + (t.getAssignedTo() != null ? t.getAssignedTo().getName() : "System");
                type = "TICKET_RESOLVED";
            } else if (t.isExtensionRequested()) {
                message = "SLA extension requested on ticket #" + t.getId() + ": " + t.getExtensionReason();
                type = "EXTENSION_REQUEST";
            } else {
                message = "New ticket #" + t.getId() + " raised: " + t.getTitle();
                type = "TICKET_CREATED";
            }
            LocalDateTime timestamp = t.getUpdatedAt() != null ? t.getUpdatedAt() : t.getCreatedAt();
            recentActivity.add(RecentActivityResponse.builder()
                    .id(t.getId().toString())
                    .type(type)
                    .message(message)
                    .timestamp(timestamp)
                    .build());
        }

        // Ticket trends last 30 days
        List<Map<String, Object>> trends = new ArrayList<>();
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Ticket> last30DaysTickets = allTickets.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(thirtyDaysAgo))
                .collect(Collectors.toList());

        for (int i = 29; i >= 0; i--) {
            LocalDateTime day = LocalDateTime.now().minusDays(i);
            String dateStr = day.toLocalDate().toString();

            long created = last30DaysTickets.stream()
                    .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().equals(day.toLocalDate()))
                    .count();

            long resolvedCount = last30DaysTickets.stream()
                    .filter(t -> t.getUpdatedAt() != null &&
                            (t.getStatus() == com.meritdesk.enums.TicketStatus.RESOLVED || t.getStatus() == com.meritdesk.enums.TicketStatus.CLOSED) &&
                            t.getUpdatedAt().toLocalDate().equals(day.toLocalDate()))
                    .count();

            Map<String, Object> dayTrend = new HashMap<>();
            dayTrend.put("date", dateStr);
            dayTrend.put("created", created);
            dayTrend.put("resolved", resolvedCount);
            trends.add(dayTrend);
        }

        return DashboardStatsResponse.builder()
                .totalTickets(totalTickets)
                .totalEmployees(totalEmployees)
                .totalCustomers(totalCustomers)
                .totalDepartments(totalDepartments)
                .activeTickets(activeCount)
                .slaComplianceRate(slaCompliance)
                .resolvedTickets(resolved)
                .ticketsByPriority(ticketsByPriority)
                .ticketsByStatus(ticketsByStatus)
                .slaBreachesByDepartment(breachesByDept)
                .topEmployees(topEmployees)
                .recentActivity(recentActivity)
                .ticketTrends(trends)
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
                .maxCapacity(user.getMaxCapacity())
                .currentWorkload(workload)
                .active(user.isActive())
                .skills(skills)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private CompanyResponse toResponse(Company company) {
        long empCount = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> u.isActive() && (u.getRole() == Role.EMPLOYEE || u.getRole() == Role.DEPARTMENT_ADMIN))
                .count();
        long custCount = userRepository.findByCompanyId(company.getId()).stream()
                .filter(u -> u.isActive() && u.getRole() == Role.CUSTOMER)
                .count();

        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .email(company.getEmail())
                .status(company.getStatus().name())
                .industry(company.getIndustry())
                .address(company.getAddress())
                .size(company.getSize())
                .adminName(company.getAdminName())
                .adminEmail(company.getAdminEmail())
                .logoUrl(company.getLogoUrl())
                .website(company.getWebsite())
                .rejectionReason(company.getRejectionReason())
                .createdAt(company.getCreatedAt())
                .totalEmployees(empCount)
                .totalCustomers(custCount)
                .totalTickets(ticketRepository.countByCompanyId(company.getId()))
                .build();
    }

    public CompanyReportSummaryResponse getCompanyReports(Long companyId, LocalDateTime startDate, LocalDateTime endDate, Long departmentId) {
        List<Ticket> tickets = ticketRepository.findByCompanyId(companyId);
        
        if (startDate != null) {
            tickets = tickets.stream().filter(t -> t.getCreatedAt().isAfter(startDate)).collect(Collectors.toList());
        }
        if (endDate != null) {
            tickets = tickets.stream().filter(t -> t.getCreatedAt().isBefore(endDate)).collect(Collectors.toList());
        }
        if (departmentId != null) {
            tickets = tickets.stream().filter(t -> t.getDepartment() != null && t.getDepartment().getId().equals(departmentId)).collect(Collectors.toList());
        }

        final List<Ticket> filteredTickets = tickets;

        // 1. Department Reports
        List<Department> departments = departmentRepository.findByCompanyId(companyId);
        if (departmentId != null) {
            departments = departments.stream()
                    .filter(d -> d.getId().equals(departmentId))
                    .collect(Collectors.toList());
        }
        
        List<DepartmentReportResponse> deptReports = departments.stream().map(dept -> {
            List<Ticket> deptTickets = filteredTickets.stream()
                    .filter(t -> t.getDepartment() != null && t.getDepartment().getId().equals(dept.getId()))
                    .collect(Collectors.toList());

            long total = deptTickets.size();
            long active = deptTickets.stream()
                    .filter(t -> t.getStatus() != com.meritdesk.enums.TicketStatus.RESOLVED && t.getStatus() != com.meritdesk.enums.TicketStatus.CLOSED)
                    .count();
            long resolved = deptTickets.stream()
                    .filter(t -> t.getStatus() == com.meritdesk.enums.TicketStatus.RESOLVED || t.getStatus() == com.meritdesk.enums.TicketStatus.CLOSED)
                    .count();
            long compliant = deptTickets.stream()
                    .filter(t -> (t.getStatus() == com.meritdesk.enums.TicketStatus.RESOLVED || t.getStatus() == com.meritdesk.enums.TicketStatus.CLOSED) && !t.isSlaResolutionBreached())
                    .count();
            double compliance = resolved > 0 ? ((double) compliant / resolved) * 100.0 : 100.0;
            int load = ticketRepository.sumWorkloadWeightByDepartment(dept.getId());

            return DepartmentReportResponse.builder()
                    .departmentId(dept.getId())
                    .departmentName(dept.getName())
                    .totalTickets(total)
                    .activeTickets(active)
                    .resolvedTickets(resolved)
                    .slaComplianceRate(compliance)
                    .currentLoad(load)
                    .capacity(dept.getCapacity())
                    .build();
        }).collect(Collectors.toList());

        // 2. Employee Reports
        List<User> employees = userRepository.findByCompanyId(companyId).stream()
                .filter(u -> u.getRole() == Role.EMPLOYEE || u.getRole() == Role.DEPARTMENT_ADMIN)
                .collect(Collectors.toList());
        
        if (departmentId != null) {
            employees = employees.stream()
                    .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(departmentId))
                    .collect(Collectors.toList());
        }

        List<EmployeeReportResponse> empReports = employees.stream().map(emp -> {
            List<Ticket> empResolved = filteredTickets.stream()
                    .filter(t -> t.getAssignedTo() != null && t.getAssignedTo().getId().equals(emp.getId()) &&
                            (t.getStatus() == com.meritdesk.enums.TicketStatus.RESOLVED || t.getStatus() == com.meritdesk.enums.TicketStatus.CLOSED))
                    .collect(Collectors.toList());

            long resolved = empResolved.size();
            double avgHours = 0.0;
            if (resolved > 0) {
                long totalMinutes = empResolved.stream()
                        .filter(t -> t.getUpdatedAt() != null)
                        .mapToLong(t -> java.time.Duration.between(t.getCreatedAt(), t.getUpdatedAt()).toMinutes())
                        .sum();
                avgHours = (double) totalMinutes / 60.0 / resolved;
            }

            return EmployeeReportResponse.builder()
                    .employeeId(emp.getId())
                    .employeeName(emp.getName())
                    .departmentName(emp.getDepartment() != null ? emp.getDepartment().getName() : "Unassigned")
                    .ticketsResolved(resolved)
                    .avgResolutionTimeHours(avgHours)
                    .honourScore(emp.getHonourScore())
                    .honourLevel(HonourLevel.fromScore(emp.getHonourScore()).getDisplayName())
                    .build();
        }).collect(Collectors.toList());

        // 3. SLA Breach Reports
        List<Ticket> breachedTickets = filteredTickets.stream()
                .filter(t -> t.isSlaResponseBreached() || t.isSlaResolutionBreached())
                .collect(Collectors.toList());

        List<SlaBreachReportResponse> breachReports = breachedTickets.stream().map(t -> {
            String type = t.isSlaResolutionBreached() ? "RESOLUTION" : "RESPONSE";
            LocalDateTime deadline = t.isSlaResolutionBreached() ? t.getSlaResolutionDeadline() : t.getSlaResponseDeadline();
            
            String rootCause = "Breached deadline: " + (deadline != null ? deadline.toString() : "N/A") + ". ";
            if (t.getAssignedTo() == null) {
                rootCause += "Ticket was unassigned.";
            } else {
                int workload = ticketRepository.sumWorkloadWeightByEmployee(t.getAssignedTo().getId());
                rootCause += "Assigned employee: " + t.getAssignedTo().getName() + " with active workload: " + workload;
            }
            if (t.isInOverflow()) {
                rootCause += " (Ticket in department overflow)";
            }

            return SlaBreachReportResponse.builder()
                    .ticketId(t.getId())
                    .title(t.getTitle())
                    .priority(t.getPriority().name())
                    .category(t.getCategory())
                    .departmentName(t.getDepartment() != null ? t.getDepartment().getName() : "Unassigned")
                    .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getName() : "Unassigned")
                    .breachedDeadline(deadline)
                    .breachType(type)
                    .rootCause(rootCause)
                    .build();
        }).collect(Collectors.toList());

        // Recurring Categories
        Map<String, Long> recurringCategories = breachedTickets.stream()
                .filter(t -> t.getCategory() != null && !t.getCategory().isBlank())
                .collect(Collectors.groupingBy(Ticket::getCategory, Collectors.counting()));

        // Honour Leaderboard
        List<EmployeeResponse> leaderboard = employees.stream()
                .sorted(Comparator.comparing(User::getHonourScore).reversed())
                .map(this::toEmployeeResponse)
                .collect(Collectors.toList());

        return CompanyReportSummaryResponse.builder()
                .departmentReports(deptReports)
                .employeeReports(empReports)
                .breachReports(breachReports)
                .honourLeaderboard(leaderboard)
                .recurringCategories(recurringCategories)
                .build();
    }

    @Transactional
    public void seedSampleCompanies() {
        // Company 1: MeritCorp
        Company c1 = companyRepository.findByEmail("info@meritcorp.com").orElseGet(() ->
                companyRepository.save(Company.builder()
                        .name("MeritCorp")
                        .email("info@meritcorp.com")
                        .status(CompanyStatus.ACTIVE)
                        .adminName("MeritCorp Admin")
                        .adminEmail("admin@meritcorp.com")
                        .industry("Technology")
                        .size("100-500")
                        .website("www.meritcorp.com")
                        .build()));

        if (!userRepository.existsByEmail("admin@meritcorp.com")) {
            userRepository.save(User.builder()
                    .name("MeritCorp Admin")
                    .email("admin@meritcorp.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.COMPANY_ADMIN)
                    .company(c1)
                    .active(true)
                    .build());
        }
        departmentService.seedSampleDataForCompany(c1);

        // Company 2: Nexus Technologies
        Company c2 = companyRepository.findByEmail("contact@nexustech.com").orElseGet(() ->
                companyRepository.save(Company.builder()
                        .name("Nexus Technologies")
                        .email("contact@nexustech.com")
                        .status(CompanyStatus.ACTIVE)
                        .adminName("Nexus Admin")
                        .adminEmail("admin@nexustech.com")
                        .industry("Software & Cloud")
                        .size("50-200")
                        .website("www.nexustech.com")
                        .build()));

        if (!userRepository.existsByEmail("admin@nexustech.com")) {
            userRepository.save(User.builder()
                    .name("Nexus Admin")
                    .email("admin@nexustech.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.COMPANY_ADMIN)
                    .company(c2)
                    .active(true)
                    .build());
        }
        seedCompanyWithDepartmentsAndMembers(c2,
                "Cloud Operations", "David Miller (Dept Admin)", "cloud.admin@nexustech.com", "Robert Chen", "robert.cloud@nexustech.com", "Emily Watson", "emily.cloud@nexustech.com",
                "Technical Support", "Susan Vance (Dept Admin)", "tech.admin@nexustech.com", "James Wilson", "james.tech@nexustech.com", "Lisa Ray", "lisa.tech@nexustech.com");

        // Company 3: Apex Global Solutions
        Company c3 = companyRepository.findByEmail("hello@apexglobal.com").orElseGet(() ->
                companyRepository.save(Company.builder()
                        .name("Apex Global Solutions")
                        .email("hello@apexglobal.com")
                        .status(CompanyStatus.ACTIVE)
                        .adminName("Apex Admin")
                        .adminEmail("admin@apexglobal.com")
                        .industry("Financial Services")
                        .size("200-1000")
                        .website("www.apexglobal.com")
                        .build()));

        if (!userRepository.existsByEmail("admin@apexglobal.com")) {
            userRepository.save(User.builder()
                    .name("Apex Admin")
                    .email("admin@apexglobal.com")
                    .password(passwordEncoder.encode("Password@123"))
                    .role(Role.COMPANY_ADMIN)
                    .company(c3)
                    .active(true)
                    .build());
        }
        seedCompanyWithDepartmentsAndMembers(c3,
                "Billing & Accounts", "Thomas Anderson (Dept Admin)", "billing.admin@apexglobal.com", "Bruce Wayne", "bruce.billing@apexglobal.com", "Clark Kent", "clark.billing@apexglobal.com",
                "Client Success", "Diana Prince (Dept Admin)", "success.admin@apexglobal.com", "Barry Allen", "barry.success@apexglobal.com", "Arthur Curry", "arthur.success@apexglobal.com");
    }

    private void seedCompanyWithDepartmentsAndMembers(
            Company company,
            String dept1Name, String dept1AdminName, String dept1AdminEmail, String dept1Emp1Name, String dept1Emp1Email, String dept1Emp2Name, String dept1Emp2Email,
            String dept2Name, String dept2AdminName, String dept2AdminEmail, String dept2Emp1Name, String dept2Emp1Email, String dept2Emp2Name, String dept2Emp2Email) {

        // Dept 1
        Department d1 = departmentRepository.findByCompanyId(company.getId()).stream()
                .filter(d -> d.getName().equalsIgnoreCase(dept1Name))
                .findFirst()
                .orElseGet(() -> departmentRepository.save(Department.builder()
                        .name(dept1Name)
                        .description("Department for " + dept1Name)
                        .capacity(100)
                        .company(company)
                        .build()));

        if (!userRepository.existsByEmail(dept1AdminEmail)) {
            userRepository.save(User.builder().name(dept1AdminName).email(dept1AdminEmail).password(passwordEncoder.encode("Password@123")).role(Role.DEPARTMENT_ADMIN).company(company).department(d1).active(true).available(true).honourScore(120.0).maxCapacity(25).build());
        }
        if (!userRepository.existsByEmail(dept1Emp1Email)) {
            userRepository.save(User.builder().name(dept1Emp1Name).email(dept1Emp1Email).password(passwordEncoder.encode("Password@123")).role(Role.EMPLOYEE).company(company).department(d1).active(true).available(true).honourScore(100.0).maxCapacity(20).build());
        }
        if (!userRepository.existsByEmail(dept1Emp2Email)) {
            userRepository.save(User.builder().name(dept1Emp2Name).email(dept1Emp2Email).password(passwordEncoder.encode("Password@123")).role(Role.EMPLOYEE).company(company).department(d1).active(true).available(true).honourScore(105.0).maxCapacity(20).build());
        }

        // Dept 2
        Department d2 = departmentRepository.findByCompanyId(company.getId()).stream()
                .filter(d -> d.getName().equalsIgnoreCase(dept2Name))
                .findFirst()
                .orElseGet(() -> departmentRepository.save(Department.builder()
                        .name(dept2Name)
                        .description("Department for " + dept2Name)
                        .capacity(100)
                        .company(company)
                        .build()));

        if (!userRepository.existsByEmail(dept2AdminEmail)) {
            userRepository.save(User.builder().name(dept2AdminName).email(dept2AdminEmail).password(passwordEncoder.encode("Password@123")).role(Role.DEPARTMENT_ADMIN).company(company).department(d2).active(true).available(true).honourScore(125.0).maxCapacity(25).build());
        }
        if (!userRepository.existsByEmail(dept2Emp1Email)) {
            userRepository.save(User.builder().name(dept2Emp1Name).email(dept2Emp1Email).password(passwordEncoder.encode("Password@123")).role(Role.EMPLOYEE).company(company).department(d2).active(true).available(true).honourScore(110.0).maxCapacity(20).build());
        }
        if (!userRepository.existsByEmail(dept2Emp2Email)) {
            userRepository.save(User.builder().name(dept2Emp2Name).email(dept2Emp2Email).password(passwordEncoder.encode("Password@123")).role(Role.EMPLOYEE).company(company).department(d2).active(true).available(true).honourScore(115.0).maxCapacity(20).build());
        }
    }
}
