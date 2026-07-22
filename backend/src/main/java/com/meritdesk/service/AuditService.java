package com.meritdesk.service;

import com.meritdesk.entity.AuditLog;
import com.meritdesk.entity.User;
import com.meritdesk.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(User user, String action, String details, String entityType, Long entityId) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .details(details)
                .entityType(entityType)
                .entityId(entityId)
                .build();
        auditLogRepository.save(log);
    }

    public void log(User user, String action, String details) {
        log(user, action, details, null, null);
    }
}
