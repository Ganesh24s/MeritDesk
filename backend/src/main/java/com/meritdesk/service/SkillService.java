package com.meritdesk.service;

import com.meritdesk.dto.request.CreateSLAPolicyRequest;
import com.meritdesk.dto.request.CreateSkillRequest;
import com.meritdesk.dto.response.SkillResponse;
import com.meritdesk.enums.TicketPriority;
import com.meritdesk.entity.*;
import com.meritdesk.exception.BadRequestException;
import com.meritdesk.exception.ResourceNotFoundException;
import com.meritdesk.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.meritdesk.dto.request.BulkSkillAssignmentRequest;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SkillService {

    private final SkillRepository skillRepository;
    private final SLAPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;

    @Transactional
    public SkillResponse createSkill(CreateSkillRequest request, User admin) {
        Long companyId = admin.getCompany().getId();
        if (skillRepository.existsByNameAndCompanyId(request.getName(), companyId)) {
            throw new BadRequestException("Skill already exists");
        }
        Skill skill = Skill.builder()
                .name(request.getName())
                .category(request.getCategory())
                .company(admin.getCompany())
                .build();
        skill = skillRepository.save(skill);
        return toResponse(skill);
    }

    @Transactional
    public SkillResponse updateSkill(Long id, CreateSkillRequest request, Long companyId) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));
        if (!skill.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Skill does not belong to your company");
        }
        skill.setName(request.getName());
        skill.setCategory(request.getCategory());
        skill = skillRepository.save(skill);
        return toResponse(skill);
    }

    @Transactional
    public void bulkAssignSkills(BulkSkillAssignmentRequest request, Long companyId) {
        List<User> employees = userRepository.findAllById(request.getEmployeeIds());
        List<Skill> skills = skillRepository.findAllById(request.getSkillIds());

        for (User emp : employees) {
            if (emp.getCompany() == null || !emp.getCompany().getId().equals(companyId)) {
                throw new BadRequestException("Employee " + emp.getId() + " does not belong to your company");
            }
            emp.getSkills().addAll(skills);
            userRepository.save(emp);
        }
    }

    public List<SkillResponse> getSkillsByCompany(Long companyId) {
        return skillRepository.findByCompanyId(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSkill(Long id, Long companyId) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found"));
        if (!skill.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Skill does not belong to your company");
        }
        // Remove relationships from employees first to prevent constraint violations
        List<User> employees = userRepository.findByCompanyId(companyId);
        for (User emp : employees) {
            if (emp.getSkills().remove(skill)) {
                userRepository.save(emp);
            }
        }
        skillRepository.delete(skill);
    }

    // SLA Policy management
    @Transactional
    public SLAPolicy createOrUpdateSLAPolicy(CreateSLAPolicyRequest request, User admin) {
        Long companyId = admin.getCompany().getId();
        TicketPriority priority = TicketPriority.valueOf(request.getPriority().toUpperCase());
        String category = request.getCategory() != null ? request.getCategory().trim() : null;

        SLAPolicy policy;
        if (category == null || category.isEmpty()) {
            policy = slaPolicyRepository.findByCompanyIdAndPriorityAndCategoryIsNullAndActiveTrue(companyId, priority)
                    .orElse(SLAPolicy.builder()
                            .company(admin.getCompany())
                            .priority(priority)
                            .build());
        } else {
            policy = slaPolicyRepository.findByCompanyIdAndPriorityAndCategoryAndActiveTrue(companyId, priority, category)
                    .orElse(SLAPolicy.builder()
                            .company(admin.getCompany())
                            .priority(priority)
                            .category(category)
                            .build());
        }

        policy.setResponseTimeMinutes(request.getResponseTimeMinutes());
        policy.setResolutionTimeMinutes(request.getResolutionTimeMinutes());
        policy.setActive(request.isActive());

        return slaPolicyRepository.save(policy);
    }

    @Transactional
    public List<SLAPolicy> inheritDefaultSLAPolicies(User admin) {
        Long companyId = admin.getCompany().getId();
        List<SLAPolicy> existing = slaPolicyRepository.findByCompanyId(companyId);
        slaPolicyRepository.deleteAll(existing);

        for (TicketPriority priority : TicketPriority.values()) {
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
                    .company(admin.getCompany())
                    .priority(priority)
                    .responseTimeMinutes(responseMins)
                    .resolutionTimeMinutes(resolutionMins)
                    .active(true)
                    .build();
            slaPolicyRepository.save(policy);
        }
        return slaPolicyRepository.findByCompanyId(companyId);
    }

    public List<SLAPolicy> getSLAPolicies(Long companyId) {
        return slaPolicyRepository.findByCompanyId(companyId);
    }

    @Transactional
    public void deleteSLAPolicy(Long id, Long companyId) {
        SLAPolicy policy = slaPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SLA Policy not found"));
        if (!policy.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("SLA Policy does not belong to your company");
        }
        slaPolicyRepository.deleteById(id);
    }

    private SkillResponse toResponse(Skill skill) {
        long count = userRepository.countEmployeesWithSkill(skill.getId());
        return SkillResponse.builder()
                .id(skill.getId())
                .name(skill.getName())
                .category(skill.getCategory())
                .employeeCount(count)
                .build();
    }
}
