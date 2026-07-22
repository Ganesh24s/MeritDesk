package com.meritdesk.repository;

import com.meritdesk.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findByCompanyId(Long companyId);

    Optional<Department> findByIdAndCompanyId(Long id, Long companyId);

    boolean existsByNameAndCompanyId(String name, Long companyId);
}
