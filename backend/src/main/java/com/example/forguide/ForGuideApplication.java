package com.example.forguide;

import com.example.forguide.common.mapper.DatabaseHealthMapper;
import java.sql.Connection;
import javax.sql.DataSource;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ForGuideApplication {

	public static void main(String[] args) {
		SpringApplication.run(ForGuideApplication.class, args);
	}

	@Bean
	ApplicationRunner databaseConnectionCheck(
			DatabaseHealthMapper mapper,
			DataSource dataSource
	) {
		return args -> {
			if (mapper.ping() != 1) {
				throw new IllegalStateException("DB 연결 확인 실패");
			}

			try (Connection connection = dataSource.getConnection()) {
				System.out.println(
						"공용 DB 연결 확인 성공: " + connection.getCatalog()
				);
			}
		};
	}
}