package com.mymapleunion.service;

/** 넥슨 API 호출이 실패했을 때 던지는 예외 */
public class NexonApiException extends RuntimeException {

    private final int nexonStatus;

    public NexonApiException(int nexonStatus, String detail) {
        super(detail);
        this.nexonStatus = nexonStatus;
    }

    /** 넥슨이 돌려준 HTTP 상태코드 (네트워크 오류면 0) */
    public int getNexonStatus() {
        return nexonStatus;
    }
}
