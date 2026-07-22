package com.meritdesk.config;

import com.meritdesk.entity.Company;
import com.meritdesk.entity.Department;
import com.meritdesk.entity.User;
import com.meritdesk.enums.CompanyStatus;
import com.meritdesk.enums.Role;
import com.meritdesk.repository.SLAPolicyRepository;
import com.meritdesk.entity.SLAPolicy;
import com.meritdesk.enums.TicketPriority;
import com.meritdesk.repository.CompanyRepository;
import com.meritdesk.repository.DepartmentRepository;
import com.meritdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"null", "unused"})
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.meritdesk.service.CompanyService companyService;

    @Value("${app.super-admin.email}")
    private String adminEmail;

    @Value("${app.super-admin.password}")
    private String adminPassword;

    @Value("${app.super-admin.name}")
    private String adminName;

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Seed Super Admin
        seedSuperAdmin();

        // 2. Seed 3 Sample Companies with Departments and Employees
        companyService.seedSampleCompanies();

        // 3. Seed Default SLA Policies
        Company company = companyRepository.findByEmail("info@meritcorp.com").orElse(null);
        if (company != null) {
            seedDefaultSLAPolicies(company);
        }

        // 4. Ensure 2 departments and 3 members per department exist for ALL companies (including test and check companies)
        seedDefaultDepartmentsAndMembersForAllCompanies();
    }

    private void seedDefaultDepartmentsAndMembersForAllCompanies() {
        List<Company> companies = companyRepository.findAll();
        for (Company c : companies) {
            List<Department> depts = departmentRepository.findByCompanyId(c.getId());
            if (depts.isEmpty()) {
                Department d1 = Department.builder()
                        .name("Support Department")
                        .description("Handles general customer support issues and inquiries")
                        .company(c)
                        .capacity(100)
                        .build();
                departmentRepository.save(d1);

                Department d2 = Department.builder()
                        .name("Technical Operations")
                        .description("Handles core platform operations and technical bug resolution")
                        .company(c)
                        .capacity(100)
                        .build();
                departmentRepository.save(d2);
                log.info("Seeded 2 departments for company: {}", c.getName());
            } else if (depts.size() == 1) {
                Department d2 = Department.builder()
                        .name("Technical Operations")
                        .description("Handles core platform operations and technical bug resolution")
                        .company(c)
                        .capacity(100)
                        .build();
                departmentRepository.save(d2);
                log.info("Seeded 2nd department for company: {}", c.getName());
            }
        }

        // Ensure each department in every company has 1 Dept Admin + 2 Employees
        seedEmployeesForDepartments();
    }

    private void seedDefaultSLAPolicies(Company company) {
        for (TicketPriority priority : TicketPriority.values()) {
            if (!slaPolicyRepository.existsByCompanyIdAndPriority(company.getId(), priority)) {
                int responseMins = 480;
                int resolutionMins = 4320;
                switch (priority) {
                    case CRITICAL:
                        responseMins = 15;
                        resolutionMins = 240;
                        break;
                    case HIGH:
                        responseMins = 30;
                        resolutionMins = 480;
                        break;
                    case MEDIUM:
                        responseMins = 120;
                        resolutionMins = 1440;
                        break;
                    case LOW:
                        responseMins = 480;
                        resolutionMins = 4320;
                        break;
                }
                SLAPolicy policy = SLAPolicy.builder()
                        .company(company)
                        .priority(priority)
                        .responseTimeMinutes(responseMins)
                        .resolutionTimeMinutes(resolutionMins)
                        .build();
                slaPolicyRepository.save(policy);
                log.info("Seeded SLA Policy for {} in company {}", priority, company.getName());
            }
        }
    }

    private void seedSuperAdmin() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User superAdmin = User.builder()
                    .name(adminName)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.SUPER_ADMIN)
                    .active(true)
                    .build();
            userRepository.save(superAdmin);
            log.info("Platform Super Admin created: {}", adminEmail);
        } else {
            log.info("Platform Super Admin already exists: {}", adminEmail);
        }
    }

    private Company seedDefaultCompany() {
        String defaultCoEmail = "info@meritcorp.com";
        Company company = companyRepository.findByEmail(defaultCoEmail).orElse(null);
        if (company == null) {
            company = Company.builder()
                    .name("MeritCorp")
                    .email(defaultCoEmail)
                    .status(CompanyStatus.ACTIVE)
                    .adminName("MeritCorp Admin")
                    .adminEmail("admin@meritcorp.com")
                    .industry("Technology")
                    .size("100-500")
                    .website("www.meritcorp.com")
                    .build();
            company = companyRepository.save(company);
            log.info("Default Company 'MeritCorp' seeded.");

            // Create Company Admin User
            if (!userRepository.existsByEmail("admin@meritcorp.com")) {
                User companyAdmin = User.builder()
                        .name("MeritCorp Admin")
                        .email("admin@meritcorp.com")
                        .password(passwordEncoder.encode("Password@123"))
                        .role(Role.COMPANY_ADMIN)
                        .company(company)
                        .active(true)
                        .build();
                userRepository.save(companyAdmin);
                log.info("Company Admin for 'MeritCorp' created: admin@meritcorp.com");
            }
        }
        return company;
    }

    private void seedDefaultDepartments(Company company) {
        if (departmentRepository.findByCompanyId(company.getId()).isEmpty()) {
            Department support = Department.builder()
                    .name("Support Department")
                    .description("Handles general customer support issues")
                    .company(company)
                    .capacity(100)
                    .build();
            departmentRepository.save(support);

            Department eng = Department.builder()
                    .name("Engineering Department")
                    .description("Handles core product development and technical bugs")
                    .company(company)
                    .capacity(100)
                    .build();
            departmentRepository.save(eng);

            log.info("Default departments 'Support Department' and 'Engineering Department' seeded.");
        }
    }

    private void seedEmployeesForDepartments() {
        List<Department> departments = departmentRepository.findAll();
        for (Department dept : departments) {
            List<User> employees = userRepository.findByDepartmentId(dept.getId());

            // Check and seed Department Admin (Manager)
            boolean hasManager = employees.stream().anyMatch(e -> e.getRole() == Role.DEPARTMENT_ADMIN);
            if (!hasManager) {
                String prefix = dept.getName().toLowerCase().split(" ")[0];
                String domain = dept.getCompany().getEmail().contains("@") 
                        ? dept.getCompany().getEmail().split("@")[1] 
                        : "example.com";
                String managerEmail = prefix + "_manager@" + domain;
                if (!userRepository.existsByEmail(managerEmail)) {
                    User manager = User.builder()
                            .name(dept.getName() + " Manager")
                            .email(managerEmail)
                            .password(passwordEncoder.encode("Password@123"))
                            .role(Role.DEPARTMENT_ADMIN)
                            .company(dept.getCompany())
                            .department(dept)
                            .active(true)
                            .available(true)
                            .honourScore(100.0)
                            .build();
                    userRepository.save(manager);
                    log.info("Seeded Department Manager for {}: {}", dept.getName(), managerEmail);
                }
            }

            // Count regular employees
            long regularEmployeeCount = employees.stream().filter(e -> e.getRole() == Role.EMPLOYEE).count();
            if (regularEmployeeCount < 2) {
                String prefix = dept.getName().toLowerCase().split(" ")[0];
                String domain = dept.getCompany().getEmail().contains("@") 
                        ? dept.getCompany().getEmail().split("@")[1] 
                        : "example.com";

                for (int i = (int) regularEmployeeCount + 1; i <= 2; i++) {
                    String employeeEmail = prefix + "_agent" + i + "@" + domain;
                    if (!userRepository.existsByEmail(employeeEmail)) {
                        User employee = User.builder()
                                .name(dept.getName() + " Agent " + i)
                                .email(employeeEmail)
                                .password(passwordEncoder.encode("Password@123"))
                                .role(Role.EMPLOYEE)
                                .company(dept.getCompany())
                                .department(dept)
                                .active(true)
                                .available(true)
                                .honourScore(100.0)
                                .maxCapacity(20)
                                .build();
                        userRepository.save(employee);
                        log.info("Seeded Employee for {}: {}", dept.getName(), employeeEmail);
                    }
                }
            }
        }
    }
}
