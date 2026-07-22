package com.meritdesk.repository;

import com.meritdesk.entity.Ticket;
import com.meritdesk.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCompanyId(Long companyId);

    Optional<Ticket> findByIdAndCompanyId(Long id, Long companyId);

    List<Ticket> findByAssignedToId(Long employeeId);

    List<Ticket> findByRaisedById(Long customerId);

    List<Ticket> findByDepartmentId(Long departmentId);

    List<Ticket> findByCompanyIdAndStatus(Long companyId, TicketStatus status);

    List<Ticket> findByCompanyIdAndInOverflowTrue(Long companyId);

    List<Ticket> findByDepartmentIdAndInOverflowTrue(Long departmentId);

    @Query("SELECT t FROM Ticket t WHERE t.assignedTo.id = :employeeId AND t.status IN :statuses")
    List<Ticket> findByAssignedToIdAndStatusIn(@Param("employeeId") Long employeeId, @Param("statuses") List<TicketStatus> statuses);

    // Count active tickets for an employee (for workload calculation)
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.assignedTo.id = :employeeId AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    long countActiveTicketsByEmployee(@Param("employeeId") Long employeeId);

    // Sum of priority weights for active tickets assigned to an employee
    @Query("SELECT COALESCE(SUM(CASE t.priority WHEN 'CRITICAL' THEN 5 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 ELSE 1 END), 0) FROM Ticket t WHERE t.assignedTo.id = :employeeId AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    int sumWorkloadWeightByEmployee(@Param("employeeId") Long employeeId);

    // Sum of priority weights for all active tickets in a department
    @Query("SELECT COALESCE(SUM(CASE t.priority WHEN 'CRITICAL' THEN 5 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 ELSE 1 END), 0) FROM Ticket t WHERE t.department.id = :deptId AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    int sumWorkloadWeightByDepartment(@Param("deptId") Long deptId);

    // Find tickets near SLA breach
    @Query("SELECT t FROM Ticket t WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS') AND t.slaResolutionDeadline IS NOT NULL AND t.slaResolutionDeadline > :now AND t.slaResolutionBreached = false")
    List<Ticket> findActiveTicketsWithSlaDeadlines(@Param("now") LocalDateTime now);

    // Find tickets that have breached SLA
    @Query("SELECT t FROM Ticket t WHERE t.status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS') AND t.slaResolutionDeadline IS NOT NULL AND t.slaResolutionDeadline < :now AND t.slaResolutionBreached = false")
    List<Ticket> findBreachedTickets(@Param("now") LocalDateTime now);

    // SLA compliance for an employee in last N days
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.assignedTo.id = :employeeId AND t.status IN ('RESOLVED', 'CLOSED') AND t.updatedAt >= :since AND t.slaResolutionBreached = false")
    long countSlaCompliantTickets(@Param("employeeId") Long employeeId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.assignedTo.id = :employeeId AND t.status IN ('RESOLVED', 'CLOSED') AND t.updatedAt >= :since")
    long countResolvedTickets(@Param("employeeId") Long employeeId, @Param("since") LocalDateTime since);

    long countByCompanyId(Long companyId);

    long countByCompanyIdAndStatus(Long companyId, TicketStatus status);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.company.id = :companyId AND t.slaResolutionBreached = false AND t.status IN ('RESOLVED', 'CLOSED')")
    long countSlaCompliantByCompany(@Param("companyId") Long companyId);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.company.id = :companyId AND t.status IN ('RESOLVED', 'CLOSED')")
    long countResolvedByCompany(@Param("companyId") Long companyId);

    @Query("SELECT t.priority, COUNT(t) FROM Ticket t WHERE t.company.id = :companyId GROUP BY t.priority")
    List<Object[]> countByCompanyGroupedByPriority(@Param("companyId") Long companyId);

    @Query("SELECT t.status, COUNT(t) FROM Ticket t WHERE t.company.id = :companyId GROUP BY t.status")
    List<Object[]> countByCompanyGroupedByStatus(@Param("companyId") Long companyId);
}
