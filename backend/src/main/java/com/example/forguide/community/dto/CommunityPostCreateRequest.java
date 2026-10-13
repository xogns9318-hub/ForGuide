package com.example.forguide.community.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityPostCreateRequest {

    private String topic;
    private String content;
    private String language;
}
