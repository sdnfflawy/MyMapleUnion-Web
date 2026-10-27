package com.mymapleunion.dto;

/** 화면에 내려줄 캐릭터 한 명의 정보 (MyMapleUnion의 VO 역할) */
public record CharacterDto(String ocid, String name, String world, String job, int level) {
}
