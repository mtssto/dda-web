package com.dda.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MediaUrlResolver {

    @Value("${app.public-base-url:}")
    private String publicBaseUrl;

    public String resolve(String url) {
        if (!StringUtils.hasText(url)) {
            return url;
        }
        String trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        if (trimmed.startsWith("/uploads/")) {
            return prefixPublicBase(trimmed);
        }
        if (trimmed.startsWith("uploads/")) {
            return prefixPublicBase("/" + trimmed);
        }
        return trimmed;
    }

    public String resolveContentHtml(String html) {
        if (!StringUtils.hasText(html) || !StringUtils.hasText(publicBaseUrl)) {
            return html;
        }
        String base = publicBaseUrl.replaceAll("/$", "");
        String resolved = html.replace("src=\"/uploads/", "src=\"" + base + "/uploads/");
        resolved = resolved.replace("src='/uploads/", "src='" + base + "/uploads/");
        return resolved;
    }

    private String prefixPublicBase(String path) {
        if (!StringUtils.hasText(publicBaseUrl)) {
            return path;
        }
        return publicBaseUrl.replaceAll("/$", "") + path;
    }
}
