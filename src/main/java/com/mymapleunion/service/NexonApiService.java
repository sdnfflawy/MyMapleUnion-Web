package com.mymapleunion.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mymapleunion.dto.CharacterDto;

/**
 * 넥슨 Open API 호출 담당.
 * 화면에서 입력한 API 키는 요청 헤더로 이 서버에 오고, 서버가 넥슨으로 그대로 전달만 합니다 (저장하지 않음).
 */
@Service
public class NexonApiService {

    private static final String BASE_URL = "https://open.api.nexon.com";
    private static final String CHARACTER_LIST_PATH = "/maplestory/v1/character/list";
    /** HTTP 헤더에 넣을 수 있는 문자(공백 없는 영문/숫자/기호)만 허용 */
    private static final Pattern KEY_PATTERN = Pattern.compile("[\\x21-\\x7E]+");

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper mapper;
    private final String defaultKey;

    public NexonApiService(ObjectMapper mapper, @Value("${nexon.api.key:}") String defaultKey) {
        this.mapper = mapper;
        this.defaultKey = defaultKey == null ? "" : defaultKey.trim();
    }

    /** 화면에서 받은 키가 있으면 그것을, 없으면 config/local.properties 의 키(선택 사항)를 사용 */
    public String resolveKey(String requestKey) {
        if (requestKey != null && !requestKey.isBlank()) {
            return requestKey.trim();
        }
        return defaultKey;
    }

    /** 내 계정의 캐릭터 목록 원본 JSON */
    public String fetchCharacterListRaw(String apiKey) {
        if (!KEY_PATTERN.matcher(apiKey).matches()) {
            throw new NexonApiException(0, "API 키 형식이 올바르지 않아요. 키에 한글이나 공백이 섞이지 않았는지 확인해 주세요.");
        }
        HttpRequest request = HttpRequest.newBuilder(URI.create(BASE_URL + CHARACTER_LIST_PATH))
                .timeout(Duration.ofSeconds(10))
                .header("x-nxopen-api-key", apiKey)
                .GET()
                .build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new NexonApiException(response.statusCode(), response.body());
            }
            return response.body();
        } catch (IOException e) {
            throw new NexonApiException(0, "넥슨 서버에 연결하지 못했습니다: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new NexonApiException(0, "요청이 중단되었습니다.");
        }
    }

    /** 내 계정의 모든 캐릭터 (42개 초과여도 전부) */
    public List<CharacterDto> fetchCharacters(String apiKey) {
        try {
            JsonNode root = mapper.readTree(fetchCharacterListRaw(apiKey));
            List<CharacterDto> result = new ArrayList<>();
            for (JsonNode account : root.path("account_list")) {
                for (JsonNode c : account.path("character_list")) {
                    result.add(new CharacterDto(
                            c.path("ocid").asText(""),
                            c.path("character_name").asText(""),
                            c.path("world_name").asText(""),
                            c.path("character_class").asText(""),
                            c.path("character_level").asInt(0)));
                }
            }
            return result;
        } catch (JsonProcessingException e) {
            throw new NexonApiException(0, "넥슨 응답을 해석하지 못했습니다: " + e.getOriginalMessage());
        }
    }
}