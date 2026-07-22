package com.meritdesk.config;

public class TenantContext {

    private static final ThreadLocal<Long> currentTenant = new ThreadLocal<>();

    public static void setCompanyId(Long companyId) {
        currentTenant.set(companyId);
    }

    public static Long getCompanyId() {
        return currentTenant.get();
    }

    public static void clear() {
        currentTenant.remove();
    }
}
