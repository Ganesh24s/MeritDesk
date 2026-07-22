package com.meritdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MeritDeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(MeritDeskApplication.class, args);
    }
}
