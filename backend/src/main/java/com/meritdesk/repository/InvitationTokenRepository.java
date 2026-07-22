package com.meritdesk.repository;

import com.meritdesk.entity.InvitationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationTokenRepository extends JpaRepository<InvitationToken, Long> {

    Optional<InvitationToken> findByToken(String token);

    Optional<InvitationToken> findByTokenAndUsedFalse(String token);

    boolean existsByEmailAndUsedFalse(String email);

    List<InvitationToken> findByDepartmentId(Long departmentId);

    List<InvitationToken> findByCompanyId(Long companyId);
}
