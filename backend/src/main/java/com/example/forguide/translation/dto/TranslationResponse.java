package com.example.forguide.translation.dto;

public record TranslationResponse(
        String translatedText,
        boolean cached
) {
}