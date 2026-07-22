package com.meritdesk.repository;

import com.meritdesk.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    List<Skill> findByCompanyId(Long companyId);

    Optional<Skill> findByNameAndCompanyId(String name, Long companyId);

    boolean existsByNameAndCompanyId(String name, Long companyId);

    List<Skill> findByIdIn(List<Long> ids);
}
