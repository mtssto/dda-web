# Backend integration — Journal & Newsletter

Copy or merge these files into your deployed `dda-backend` Spring Boot project (sibling repo or Railway deployment).

## New endpoints

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/journal/posts` | Public |
| GET | `/api/journal/posts/slug/{slug}` | Public |
| GET | `/api/journal/posts/{id}/comments` | Public |
| POST | `/api/journal/posts/{id}/comments` | Authenticated |
| POST | `/api/newsletter/subscribe` | Public |
| GET/POST | `/api/journal/admin/*` | ADMIN |
| GET | `/api/newsletter/admin/campaigns` | ADMIN |

## SecurityConfig additions

```java
.requestMatchers(HttpMethod.GET, "/api/journal/posts/**").permitAll()
.requestMatchers(HttpMethod.POST, "/api/newsletter/subscribe").permitAll()
.requestMatchers("/api/journal/admin/**").hasRole("ADMIN")
.requestMatchers("/api/newsletter/admin/**").hasRole("ADMIN")
```

## Dependencies (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

## Mail configuration (application.yml)

```yaml
spring:
  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
```

## RegisterRequest

Add `private Boolean newsletterOptIn;` and in `AuthService.register()` call `newsletterService.subscribeFromRegistration(email)` when true.
