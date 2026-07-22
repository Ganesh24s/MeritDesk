package com.meritdesk.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFeedbackSummaryResponse {
    private List<CustomerFeedbackResponse> feedbackList;
    private double averageRating;
    private long totalFeedbackCount;
}
