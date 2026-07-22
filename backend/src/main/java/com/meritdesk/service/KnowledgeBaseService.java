package com.meritdesk.service;

import com.meritdesk.dto.request.CreateKBArticleRequest;
import com.meritdesk.dto.response.KBArticleResponse;
import com.meritdesk.entity.KnowledgeBaseArticle;
import com.meritdesk.entity.Ticket;
import com.meritdesk.entity.User;
import com.meritdesk.exception.ResourceNotFoundException;
import com.meritdesk.repository.KnowledgeBaseArticleRepository;
import com.meritdesk.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import com.meritdesk.enums.Role;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class KnowledgeBaseService {

    private final KnowledgeBaseArticleRepository articleRepository;
    private final TicketRepository ticketRepository;
    private final HonourScoreService honourScoreService;

    @Transactional
    public KBArticleResponse createArticle(CreateKBArticleRequest request, User author) {
        Long companyId = author.getCompany().getId();

        Ticket sourceTicket = null;
        if (request.getTicketId() != null) {
            sourceTicket = ticketRepository.findByIdAndCompanyId(request.getTicketId(), companyId)
                    .orElse(null);
        }

        String status = "PENDING";
        if (author.getRole() == Role.COMPANY_ADMIN || author.getRole() == Role.DEPARTMENT_ADMIN) {
            status = "APPROVED";
        }

        KnowledgeBaseArticle article = KnowledgeBaseArticle.builder()
                .company(author.getCompany())
                .title(request.getTitle())
                .description(request.getDescription())
                .solution(request.getSolution())
                .tags(request.getTags())
                .createdBy(author)
                .sourceTicket(sourceTicket)
                .status(status)
                .viewCount(0)
                .helpfulCount(0)
                .unhelpfulCount(0)
                .build();
        article = articleRepository.save(article);

        // Award honour score for creating KB article
        honourScoreService.onKbArticleCreated(author);

        return toResponse(article);
    }

    @Transactional
    public KBArticleResponse updateArticle(Long id, CreateKBArticleRequest request, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        article.setTitle(request.getTitle());
        article.setDescription(request.getDescription());
        article.setSolution(request.getSolution());
        article.setTags(request.getTags());
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KBArticleResponse approveArticle(Long id, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        article.setStatus("APPROVED");
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KBArticleResponse rejectArticle(Long id, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        article.setStatus("REJECTED");
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KBArticleResponse archiveArticle(Long id, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        article.setStatus("ARCHIVED");
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KBArticleResponse incrementViewCount(Long id, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        article.setViewCount(article.getViewCount() + 1);
        return toResponse(articleRepository.save(article));
    }

    @Transactional
    public KBArticleResponse voteArticle(Long id, boolean helpful, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        if (helpful) {
            article.setHelpfulCount(article.getHelpfulCount() + 1);
        } else {
            article.setUnhelpfulCount(article.getUnhelpfulCount() + 1);
        }
        return toResponse(articleRepository.save(article));
    }

    public List<KBArticleResponse> getArticlesByCompany(Long companyId) {
        return articleRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public KBArticleResponse getArticle(Long id, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        return toResponse(article);
    }

    public List<KBArticleResponse> searchArticles(Long companyId, String query) {
        return articleRepository.searchByCompany(companyId, query).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteArticle(Long id, Long companyId) {
        KnowledgeBaseArticle article = articleRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        articleRepository.delete(article);
    }

    private KBArticleResponse toResponse(KnowledgeBaseArticle a) {
        return KBArticleResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .description(a.getDescription())
                .solution(a.getSolution())
                .tags(a.getTags())
                .createdByName(a.getCreatedBy() != null ? a.getCreatedBy().getName() : null)
                .sourceTicketId(a.getSourceTicket() != null ? a.getSourceTicket().getId() : null)
                .status(a.getStatus())
                .viewCount(a.getViewCount())
                .helpfulCount(a.getHelpfulCount())
                .unhelpfulCount(a.getUnhelpfulCount())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
