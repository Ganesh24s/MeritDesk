package com.meritdesk.service;

import com.meritdesk.entity.*;
import com.meritdesk.enums.HonourLevel;
import com.meritdesk.repository.HonourScoreHistoryRepository;
import com.meritdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class HonourScoreService {

    private final UserRepository userRepository;
    private final HonourScoreHistoryRepository historyRepository;

    // Score change amounts
    public static final double SLA_MET = 5.0;
    public static final double POSITIVE_FEEDBACK = 2.0;
    public static final double KB_ARTICLE_CREATED = 3.0;
    public static final double HELPED_TEAMMATE = 1.0;
    public static final double SLA_BREACH = -10.0;
    public static final double NEGATIVE_FEEDBACK = -3.0;
    public static final double TICKET_REOPENED = -2.0;
    public static final double LATE_RESOLUTION = -5.0;

    @Transactional
    public void updateScore(User employee, double change, String reason) {
        User dbEmployee = userRepository.findById(employee.getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        double newScore = Math.max(0, Math.min(100, dbEmployee.getHonourScore() + change));
        dbEmployee.setHonourScore(newScore);
        userRepository.save(dbEmployee);

        HonourScoreHistory history = HonourScoreHistory.builder()
                .employee(dbEmployee)
                .changeAmount(change)
                .reason(reason)
                .scoreAfterChange(newScore)
                .build();
        historyRepository.save(history);

        log.info("Honour score updated for employee {}: {} ({}) -> {}", 
                dbEmployee.getName(), change > 0 ? "+" + change : change, reason, newScore);
    }

    public void onSlaMet(User employee) {
        updateScore(employee, SLA_MET, "SLA deadline met");
    }

    public void onPositiveFeedback(User employee) {
        updateScore(employee, POSITIVE_FEEDBACK, "Positive customer feedback");
    }

    public void onKbArticleCreated(User employee) {
        updateScore(employee, KB_ARTICLE_CREATED, "Knowledge base article created");
    }

    public void onHelpedTeammate(User employee) {
        updateScore(employee, HELPED_TEAMMATE, "Helped teammate (admin award)");
    }

    public void onSlaBreach(User employee) {
        updateScore(employee, SLA_BREACH, "SLA deadline breached");
    }

    public void onNegativeFeedback(User employee) {
        updateScore(employee, NEGATIVE_FEEDBACK, "Negative customer feedback");
    }

    public void onTicketReopened(User employee) {
        updateScore(employee, TICKET_REOPENED, "Ticket reopened by customer");
    }

    public void onLateResolution(User employee) {
        updateScore(employee, LATE_RESOLUTION, "Late resolution");
    }

    public HonourLevel getLevel(double score) {
        return HonourLevel.fromScore(score);
    }

    public boolean canAccessOverflow(User employee) {
        return employee.getHonourScore() >= 80;
    }
}
