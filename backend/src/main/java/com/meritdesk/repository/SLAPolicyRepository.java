package com.meritdesk.repository;

import com.meritdesk.entity.SLAPolicy;
import com.meritdesk.enums.TicketPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SLAPolicyRepository extends JpaRepository<SLAPolicy, Long> {

    List<SLAPolicy> findByCompanyId(Long companyId);

    Optional<SLAPolicy> findByCompanyIdAndPriority(Long companyId, TicketPriority priority);

    boolean existsByCompanyIdAndPriority(Long companyId, TicketPriority priority);

    Optional<SLAPolicy> findByCompanyIdAndPriorityAndCategoryAndActiveTrue(Long companyId, TicketPriority priority, String category);

    Optional<SLAPolicy> findByCompanyIdAndPriorityAndCategoryIsNullAndActiveTrue(Long companyId, TicketPriority priority);

    List<SLAPolicy> findByCompanyIdAndActiveTrue(Long companyId);
}
