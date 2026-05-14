package com.dda;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class DdaApplication {

    public static void main(String[] args) {
        SpringApplication.run(DdaApplication.class, args);
    }
}
