package com.meritdesk.repository;

import com.meritdesk.entity.AssignmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentHistoryRepository extends JpaRepository<AssignmentHistory, Long> {

    List<AssignmentHistory> findByTicketId(Long ticketId);

    List<AssignmentHistory> findByTicketIdOrderByAssignedAtDesc(Long ticketId);

    List<AssignmentHistory> findByEmployeeIdOrderByAssignedAtDesc(Long employeeId);
}
