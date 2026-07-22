package com.meritdesk.service;

import com.meritdesk.entity.Notification;
import com.meritdesk.entity.User;
import com.meritdesk.enums.Role;
import com.meritdesk.dto.response.NotificationResponse;
import com.meritdesk.repository.NotificationRepository;
import com.meritdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import com.meritdesk.exception.ResourceNotFoundException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public void send(User user, String message, String type, String link) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .link(link)
                .build();
        notificationRepository.save(notification);

        // Check user preferences for email notification
        boolean shouldSendEmail = false;
        if (type != null) {
            switch (type) {
                case "SLA_BREACH":
                case "SLA_WARNING":
                    shouldSendEmail = user.isEmailNotifySlaBreach();
                    break;
                case "ESCALATION":
                    shouldSendEmail = user.isEmailNotifyEscalation();
                    break;
                case "EXTENSION":
                    shouldSendEmail = user.isEmailNotifyExtensionRequest();
                    break;
                default:
                    shouldSendEmail = user.isEmailNotifySystemAlert();
                    break;
            }
        }

        if (shouldSendEmail && user.getEmail() != null) {
            emailService.sendNotificationEmail(user.getEmail(), "MeritDesk Alert - " + type, message);
        }
    }

    public void notifyCompanyAdmins(Long companyId, String message, String type) {
        List<User> admins = userRepository.findByCompanyIdAndRole(companyId, Role.COMPANY_ADMIN);
        for (User admin : admins) {
            send(admin, message, type);
        }
    }

    public void notifyDepartmentAdmins(Long companyId, Long departmentId, String message, String type) {
        List<User> deptAdmins = userRepository.findByCompanyIdAndRole(companyId, Role.DEPARTMENT_ADMIN);
        for (User admin : deptAdmins) {
            if (departmentId == null || admin.getDepartment() == null || admin.getDepartment().getId().equals(departmentId)) {
                send(admin, message, type);
            }
        }
    }

    public void send(User user, String message, String type) {
        send(user, message, type, null);
    }

    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearAllNotifications(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .link(n.getLink())
                .createdAt(n.getCreatedAt())
                .build();
    }

    public void updateEmailSettings(Long userId, Map<String, Boolean> settings) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (settings.containsKey("emailNotifySlaBreach")) {
            user.setEmailNotifySlaBreach(settings.get("emailNotifySlaBreach"));
        }
        if (settings.containsKey("emailNotifyEscalation")) {
            user.setEmailNotifyEscalation(settings.get("emailNotifyEscalation"));
        }
        if (settings.containsKey("emailNotifyExtensionRequest")) {
            user.setEmailNotifyExtensionRequest(settings.get("emailNotifyExtensionRequest"));
        }
        if (settings.containsKey("emailNotifySystemAlert")) {
            user.setEmailNotifySystemAlert(settings.get("emailNotifySystemAlert"));
        }

        userRepository.save(user);
    }

    public Map<String, Boolean> getEmailSettings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Map<String, Boolean> settings = new HashMap<>();
        settings.put("emailNotifySlaBreach", user.isEmailNotifySlaBreach());
        settings.put("emailNotifyEscalation", user.isEmailNotifyEscalation());
        settings.put("emailNotifyExtensionRequest", user.isEmailNotifyExtensionRequest());
        settings.put("emailNotifySystemAlert", user.isEmailNotifySystemAlert());
        return settings;
    }
}
