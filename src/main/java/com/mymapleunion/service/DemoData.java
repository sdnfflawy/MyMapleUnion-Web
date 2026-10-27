package com.mymapleunion.service;

import java.util.ArrayList;
import java.util.List;

import com.mymapleunion.dto.CharacterDto;

/** API 키가 없을 때 화면을 확인하기 위한 샘플 캐릭터 (45개 - 42개 초과 동작 확인용) */
public final class DemoData {

    private static final String[] JOBS = { "아델", "나이트로드", "비숍", "카이저", "팬텀", "아크메이지(불,독)" };

    private DemoData() {
    }

    public static List<CharacterDto> sample() {
        List<CharacterDto> list = new ArrayList<>();
        for (int i = 0; i < 45; i++) {
            int level = 285 - i * 3 - (i % 4);
            list.add(new CharacterDto(
                    "demo-" + i,
                    String.format("샘플캐릭터%02d", i + 1),
                    "샘플월드",
                    JOBS[i % JOBS.length],
                    level));
        }
        return list;
    }
}
