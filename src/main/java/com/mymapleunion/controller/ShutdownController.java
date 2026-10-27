package com.mymapleunion.controller;

import java.util.Map;

import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 화면의 "프로그램 종료" 버튼이 호출. 서버를 끄고 프로그램을 종료합니다. */
@RestController
@RequestMapping("/api")
public class ShutdownController {

    private final ConfigurableApplicationContext context;

    public ShutdownController(ConfigurableApplicationContext context) {
        this.context = context;
    }

    @PostMapping("/shutdown")
    public ResponseEntity<Map<String, Object>> shutdown(
            @RequestHeader(value = "X-MMU-Action", required = false) String action) {
        // 다른 웹사이트가 몰래 종료 요청을 보내지 못하게, 우리 화면만 보내는 헤더를 확인
        if (!"shutdown".equals(action)) {
            Map<String, Object> denied = Map.of("error", "허용되지 않은 요청입니다.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(denied);
        }
        // 응답을 먼저 보낸 뒤 종료하도록 잠깐 기다렸다가 끕니다
        Thread stopper = new Thread(() -> {
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            context.close();
            System.exit(0);
        });
        stopper.start();
        Map<String, Object> body = Map.of("message", "종료합니다.");
        return ResponseEntity.ok(body);
    }
}
