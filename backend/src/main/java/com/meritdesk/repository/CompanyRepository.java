package com.meritdesk.repository;

import com.meritdesk.entity.Company;
import com.meritdesk.enums.CompanyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByEmail(String email);

    List<Company> findByStatus(CompanyStatus status);

    boolean existsByEmail(String email);

    boolean existsByName(String name);

    List<Company> findAllByOrderByCreatedAtDesc();
}
