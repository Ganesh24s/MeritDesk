package com.meritdesk.repository;

import com.meritdesk.entity.HonourScoreHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HonourScoreHistoryRepository extends JpaRepository<HonourScoreHistory, Long> {

    List<HonourScoreHistory> findByEmployeeIdOrderByTimestampDesc(Long employeeId);

    List<HonourScoreHistory> findTop20ByEmployeeIdOrderByTimestampDesc(Long employeeId);

    void deleteByEmployeeId(Long employeeId);
}
