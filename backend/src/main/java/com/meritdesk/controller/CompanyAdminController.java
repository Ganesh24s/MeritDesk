package com.meritdesk.controller;

import com.meritdesk.dto.request.*;
import com.meritdesk.dto.response.*;
import com.meritdesk.entity.SLAPolicy;
import com.meritdesk.entity.User;
import com.meritdesk.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company")
@PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CompanyAdminController {

    private final DepartmentService departmentService;
    private final AuthService authService;
    private final SkillService skillService;
    private final TicketService ticketService;
    private final KnowledgeBaseService knowledgeBaseService;
    private final CompanyService companyService;
    private final NotificationService notificationService;

    // ==================== Dashboard ====================

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getCompanyStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.getCompanyStats(user.getCompany().getId()));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<EmployeeResponse>> getLeaderboard(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.getEmployeesByCompany(user.getCompany().getId()));
    }

    // ==================== Departments ====================

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentResponse>> getDepartments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.getDepartmentsByCompany(user.getCompany().getId()));
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentResponse> createDepartment(
            @Valid @RequestBody CreateDepartmentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.createDepartment(request, user));
    }

    @PutMapping("/departments/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody CreateDepartmentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, request, user.getCompany().getId()));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<ApiResponse> deleteDepartment(@PathVariable Long id,
                                                         @AuthenticationPrincipal User user) {
        departmentService.deleteDepartment(id, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("Department deleted"));
    }

    @PostMapping("/departments/seed-sample-data")
    public ResponseEntity<ApiResponse> seedSampleData(@AuthenticationPrincipal User user) {
        departmentService.seedSampleDataForCompany(user.getCompany());
        return ResponseEntity.ok(ApiResponse.success("Sample departments and members created successfully"));
    }

    // ==================== Employees ====================

    @GetMapping("/employees")
    public ResponseEntity<List<EmployeeResponse>> getEmployees(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.getEmployeesByCompany(user.getCompany().getId()));
    }

    @GetMapping("/employees/{id}")
    public ResponseEntity<EmployeeResponse> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getEmployee(id));
    }

    @PostMapping("/employees/invite")
    public ResponseEntity<ApiResponse> inviteEmployee(
            @Valid @RequestBody InviteEmployeeRequest request,
            @AuthenticationPrincipal User user) {
        authService.inviteEmployee(request, user);
        return ResponseEntity.ok(ApiResponse.success("Invitation sent to " + request.getEmail()));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(departmentService.updateEmployee(id, request, user.getCompany().getId()));
    }

    @PutMapping("/employees/{id}/deactivate")
    public ResponseEntity<ApiResponse> deactivateEmployee(@PathVariable Long id,
                                                            @AuthenticationPrincipal User user) {
        departmentService.deactivateEmployee(id, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("Employee deactivated"));
    }

    @PutMapping("/employees/{id}/activate")
    public ResponseEntity<ApiResponse> activateEmployee(@PathVariable Long id,
                                                          @AuthenticationPrincipal User user) {
        departmentService.activateEmployee(id, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("Employee activated"));
    }

    @DeleteMapping("/employees/{id}")
    public ResponseEntity<ApiResponse> deleteEmployee(@PathVariable Long id,
                                                        @AuthenticationPrincipal User user) {
        departmentService.deleteEmployee(id, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully"));
    }

    // ==================== Skills ====================

    @GetMapping("/skills")
    public ResponseEntity<List<SkillResponse>> getSkills(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.getSkillsByCompany(user.getCompany().getId()));
    }

    @PostMapping("/skills")
    public ResponseEntity<SkillResponse> createSkill(@Valid @RequestBody CreateSkillRequest request,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.createSkill(request, user));
    }

    @PutMapping("/skills/{id}")
    public ResponseEntity<SkillResponse> updateSkill(@PathVariable Long id,
                                                      @Valid @RequestBody CreateSkillRequest request,
                                                      @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.updateSkill(id, request, user.getCompany().getId()));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<ApiResponse> deleteSkill(@PathVariable Long id,
                                                    @AuthenticationPrincipal User user) {
        skillService.deleteSkill(id, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("Skill deleted"));
    }

    @PostMapping("/skills/bulk-assign")
    public ResponseEntity<ApiResponse> bulkAssignSkills(@Valid @RequestBody BulkSkillAssignmentRequest request,
                                                         @AuthenticationPrincipal User user) {
        skillService.bulkAssignSkills(request, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("Skills assigned to employees successfully"));
    }

    // ==================== SLA Policies ====================

    @GetMapping("/sla-policies")
    public ResponseEntity<List<SLAPolicy>> getSLAPolicies(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.getSLAPolicies(user.getCompany().getId()));
    }

    @PostMapping("/sla-policies")
    public ResponseEntity<SLAPolicy> createSLAPolicy(@Valid @RequestBody CreateSLAPolicyRequest request,
                                                       @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(skillService.createOrUpdateSLAPolicy(request, user));
    }

    @PostMapping("/sla-policies/inherit-defaults")
    public ResponseEntity<ApiResponse> inheritDefaultSLAs(@AuthenticationPrincipal User user) {
        skillService.inheritDefaultSLAPolicies(user);
        return ResponseEntity.ok(ApiResponse.success("Default SLA policies inherited successfully"));
    }

    @DeleteMapping("/sla-policies/{id}")
    public ResponseEntity<ApiResponse> deleteSLAPolicy(@PathVariable Long id,
                                                         @AuthenticationPrincipal User user) {
        skillService.deleteSLAPolicy(id, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("SLA Policy deleted"));
    }

    // ==================== Knowledge Base ====================

    @GetMapping("/knowledge-base")
    public ResponseEntity<List<KBArticleResponse>> getKBArticles(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.getArticlesByCompany(user.getCompany().getId()));
    }

    @GetMapping("/knowledge-base/search")
    public ResponseEntity<List<KBArticleResponse>> searchKBArticles(
            @RequestParam String query, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.searchArticles(user.getCompany().getId(), query));
    }

    @PostMapping("/knowledge-base")
    public ResponseEntity<KBArticleResponse> createKBArticle(
            @Valid @RequestBody CreateKBArticleRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.createArticle(request, user));
    }

    @PutMapping("/knowledge-base/{id}")
    public ResponseEntity<KBArticleResponse> updateKBArticle(
            @PathVariable Long id,
            @Valid @RequestBody CreateKBArticleRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.updateArticle(id, request, user.getCompany().getId()));
    }

    @PutMapping("/knowledge-base/{id}/approve")
    public ResponseEntity<KBArticleResponse> approveKBArticle(@PathVariable Long id,
                                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.approveArticle(id, user.getCompany().getId()));
    }

    @PutMapping("/knowledge-base/{id}/reject")
    public ResponseEntity<KBArticleResponse> rejectKBArticle(@PathVariable Long id,
                                                               @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.rejectArticle(id, user.getCompany().getId()));
    }

    @PutMapping("/knowledge-base/{id}/archive")
    public ResponseEntity<KBArticleResponse> archiveKBArticle(@PathVariable Long id,
                                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(knowledgeBaseService.archiveArticle(id, user.getCompany().getId()));
    }

    @PostMapping("/knowledge-base/{id}/view")
    public ResponseEntity<ApiResponse> viewKBArticle(@PathVariable Long id, @AuthenticationPrincipal User user) {
        knowledgeBaseService.incrementViewCount(id, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("View counted"));
    }

    @PostMapping("/knowledge-base/{id}/vote")
    public ResponseEntity<ApiResponse> voteKBArticle(@PathVariable Long id,
                                                       @RequestParam boolean helpful,
                                                       @AuthenticationPrincipal User user) {
        knowledgeBaseService.voteArticle(id, helpful, user.getCompany().getId());
        return ResponseEntity.ok(ApiResponse.success("Vote recorded"));
    }

    // ==================== Tickets ====================

    @GetMapping("/tickets")
    public ResponseEntity<List<TicketResponse>> getAllTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getTicketsByCompany(user.getCompany().getId()));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PutMapping("/tickets/{id}/assign/{employeeId}")
    public ResponseEntity<TicketResponse> overrideAssignment(
            @PathVariable Long id,
            @PathVariable Long employeeId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.overrideAssignment(id, employeeId, user));
    }

    @PutMapping("/tickets/{id}/escalate")
    public ResponseEntity<TicketResponse> escalateTicket(@PathVariable Long id,
                                                           @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.escalateTicket(id, user));
    }

    @GetMapping("/tickets/extension-requests")
    public ResponseEntity<List<TicketResponse>> getExtensionRequests(@AuthenticationPrincipal User user) {
        List<TicketResponse> allTickets = ticketService.getTicketsByCompany(user.getCompany().getId());
        List<TicketResponse> extensionRequests = allTickets.stream()
                .filter(TicketResponse::isExtensionRequested)
                .toList();
        return ResponseEntity.ok(extensionRequests);
    }

    @PutMapping("/tickets/{id}/extension/approve")
    public ResponseEntity<TicketResponse> approveExtension(@PathVariable Long id,
                                                             @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.handleExtensionRequest(id, true, user));
    }

    @PutMapping("/tickets/{id}/extension/reject")
    public ResponseEntity<TicketResponse> rejectExtension(@PathVariable Long id,
                                                            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.handleExtensionRequest(id, false, user));
    }

    // ==================== Reports ====================

    @GetMapping("/reports")
    public ResponseEntity<CompanyReportSummaryResponse> getReports(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(companyService.getCompanyReports(user.getCompany().getId(), startDate, endDate, departmentId));
    }

    // ==================== Notifications Settings ====================

    @PutMapping("/notification-settings")
    public ResponseEntity<ApiResponse> updateNotificationSettings(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Boolean> settings) {
        notificationService.updateEmailSettings(user.getId(), settings);
        return ResponseEntity.ok(ApiResponse.success("Notification settings updated"));
    }

    @GetMapping("/notification-settings")
    public ResponseEntity<Map<String, Boolean>> getNotificationSettings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getEmailSettings(user.getId()));
    }

    // ==================== Settings ====================

    @PutMapping("/settings")
    public ResponseEntity<CompanyResponse> updateCompanySettings(
            @Valid @RequestBody UpdateCompanySettingsRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.updateCompanySettings(user.getCompany().getId(), request));
    }

    @GetMapping("/settings")
    public ResponseEntity<CompanyResponse> getCompanySettings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.getCompany(user.getCompany().getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<EmployeeResponse> updateAdminProfile(
            @Valid @RequestBody UpdateAdminProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.updateProfile(user.getId(), request));
    }
}
