package com.meritdesk.repository;

import com.meritdesk.entity.KnowledgeBaseArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeBaseArticleRepository extends JpaRepository<KnowledgeBaseArticle, Long> {

    List<KnowledgeBaseArticle> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    Optional<KnowledgeBaseArticle> findByIdAndCompanyId(Long id, Long companyId);

    @Query("SELECT k FROM KnowledgeBaseArticle k WHERE k.company.id = :companyId AND (LOWER(k.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(k.tags) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(k.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<KnowledgeBaseArticle> searchByCompany(@Param("companyId") Long companyId, @Param("query") String query);

    long countByCompanyId(Long companyId);

    long countByCreatedById(Long userId);
}
