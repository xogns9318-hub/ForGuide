package com.example.forguide.common.transaction;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class AfterCommitExecutor {

    // DB 커밋이 끝난 뒤에만 외부 작업을 실행한다.
    // 파일 삭제처럼 DB 롤백과 함께 되돌릴 수 없는 작업에 사용
    public void run(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException(
                    "트랜잭션 안에서만 커밋 후 작업을 등록할 수 있습니다."
            );
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            }
        );
    }

    // 캐시처럼 DB와 완전히 일치하지 않아도 되는 작업에 사용한다.
    // 트랜잭션이 있으면 커밋 뒤 실행하고, 없으면 즉시 실행한다.
    public void runAfterCommitOrNow(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }

        run(action);
    }

}
