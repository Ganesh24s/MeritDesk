package com.meritdesk.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateCompanySettingsRequest {

    @NotBlank(message = "Company name is required")
    private String name;

    private String logoUrl;

    private String website;

    private String address;

    private String industry;
}
