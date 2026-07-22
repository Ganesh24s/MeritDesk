package com.meritdesk.repository;

import com.meritdesk.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    Optional<Feedback> findByTicketId(Long ticketId);

    List<Feedback> findByCustomerId(Long customerId);

    boolean existsByTicketId(Long ticketId);

    @Query("SELECT AVG(f.rating) FROM Feedback f JOIN f.ticket t WHERE t.assignedTo.id = :employeeId")
    Double averageRatingByEmployee(@Param("employeeId") Long employeeId);
}
