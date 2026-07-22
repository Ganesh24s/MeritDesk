package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String category;
    private String requiredSkills;
    private Long departmentId;
    private String departmentName;
    private Long assignedToId;
    private String assignedToName;
    private Long raisedById;
    private String raisedByName;
    private String raisedByEmail;
    private String raisedByPhone;
    private LocalDateTime slaResponseDeadline;
    private LocalDateTime slaResolutionDeadline;
    private boolean slaResponseBreached;
    private boolean slaResolutionBreached;
    private boolean inOverflow;
    private String assignmentReasoning;
    private boolean escalated;
    private boolean extensionRequested;
    private String extensionReason;
    private LocalDateTime extensionRequestedDeadline;
    private LocalDateTime assignedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TicketHistoryResponse> history;
    private FeedbackResponse feedback;
}
