package com.mymapleunion.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mymapleunion.service.DemoData;
import com.mymapleunion.service.NexonApiException;
import com.mymapleunion.service.NexonApiService;

@RestController
@RequestMapping("/api")
public class CharacterController {

    private static final String KEY_HEADER = "X-Nexon-Api-Key";

    private final NexonApiService nexon;

    public CharacterController(NexonApiService nexon) {
        this.nexon = nexon;
    }

    /**
     * 화면의 "캐릭터 불러오기" 버튼이 호출.
     * - 헤더 X-Nexon-Api-Key 에 화면에서 입력한 키가 담겨 옵니다.
     * - ?demo=true 이면 키 없이 샘플 데이터를 돌려줍니다.
     */
    @GetMapping("/characters")
    public ResponseEntity<Map<String, Object>> characters(
            @RequestHeader(value = KEY_HEADER, required = false) String requestKey,
            @RequestParam(value = "demo", defaultValue = "false") boolean demo) {

        if (demo) {
            Map<String, Object> body = Map.of("mode", "demo", "characters", DemoData.sample());
            return ResponseEntity.ok(body);
        }
        String key = nexon.resolveKey(requestKey);
        if (key.isEmpty()) {
            Map<String, Object> body = Map.of("error", "API 키를 입력해 주세요.");
            return ResponseEntity.badRequest().body(body);
        }
        Map<String, Object> body = Map.of("mode", "api", "characters", nexon.fetchCharacters(key));
        return ResponseEntity.ok(body);
    }

    /** 확인용: 넥슨이 준 원본 JSON을 그대로 보여줍니다 (config/local.properties 에 키를 넣은 경우 주소창에서 확인 가능) */
    @GetMapping(value = "/characters/raw", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> raw(@RequestHeader(value = KEY_HEADER, required = false) String requestKey) {
        String key = nexon.resolveKey(requestKey);
        if (key.isEmpty()) {
            return ResponseEntity.badRequest().body("{\"error\":\"API 키가 없습니다.\"}");
        }
        return ResponseEntity.ok(nexon.fetchCharacterListRaw(key));
    }

    @ExceptionHandler(NexonApiException.class)
    public ResponseEntity<Map<String, Object>> handleNexonError(NexonApiException e) {
        String detail = e.getMessage() == null ? "" : e.getMessage();
        Map<String, Object> body = Map.of(
                "error", "넥슨 API 호출에 실패했습니다.",
                "nexonStatus", e.getNexonStatus(),
                "detail", detail);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(body);
    }
}
