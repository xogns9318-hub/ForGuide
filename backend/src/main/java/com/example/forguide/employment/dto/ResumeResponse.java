package com.example.forguide.employment.dto;


import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter

public class ResumeResponse {

    private Long resumeId;
    private String resumeType;
    private String resumeData;
    private String photoUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
