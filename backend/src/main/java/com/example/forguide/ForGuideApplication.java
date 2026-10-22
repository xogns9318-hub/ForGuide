package com.example.forguide;

import com.example.forguide.common.mapper.DatabaseHealthMapper;
import java.sql.Connection;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ForGuideApplication {

    // 클래스 이름과 로그 수준을 포함한 공통 형식으로 출력한다.
    private static final Logger log =
            LoggerFactory.getLogger(ForGuideApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(ForGuideApplication.class, args);
    }

    @Bean
    ApplicationRunner databaseConnectionCheck(
            DatabaseHealthMapper mapper,
            DataSource dataSource
    ) {
        return args -> {
            // 간단한 조회로 DB가 응답하는지 확인한다.
            if (mapper.ping() != 1) {
                throw new IllegalStateException("DB 연결 확인 실패");
            }

            // 확인에 사용한 연결은 작업이 끝나면 자동으로 닫는다.
            try (Connection connection = dataSource.getConnection()) {
                // 비밀번호나 접속 주소 없이 연결된 DB 이름만 기록한다.
                log.info("DB 연결 확인 성공: {}", connection.getCatalog());
            }
        };
    }
}