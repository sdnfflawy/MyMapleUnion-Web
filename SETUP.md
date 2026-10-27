# MyMapleUnion (웹 화면 버전) 시작하기

## 1. 준비물 (한 번만)
- **JDK 17 이상** (Eclipse Temurin 17 등)
- **Eclipse IDE for Enterprise Java and Web Developers** (Maven 기능이 기본 포함)

## 2. 이클립스에서 열기
1. `File > Import > Maven > Existing Maven Projects` → 이 폴더(`MyMapleUnionWeb`) 선택
2. 처음에는 라이브러리를 내려받느라 오래 걸릴 수 있어요 (오른쪽 아래 진행률 확인)
3. 프로젝트 우클릭 > `Properties > Java Compiler` 에서 17 이상인지 확인
4. `MapleUnionApplication.java` 우클릭 > `Run As > Java Application`
5. 브라우저에서 http://localhost:8080 접속

## 3. 먼저 샘플 데이터로 화면 확인
API 키가 없으면 **샘플 캐릭터 45개**가 나옵니다. 버튼 클릭 → 점수 계산 → 레벨 +/- 동작을 먼저 확인하세요.

## 4. 넥슨 API 연결
1. https://openapi.nexon.com 에서 애플리케이션 등록 후 API Key 발급
2. `config/local.properties.example` 을 복사해서 `config/local.properties` 로 만들고 키 입력
   (이 파일은 `.gitignore` 에 있어서 GitHub에 올라가지 않아요)
3. 서버 재시작 → 브라우저에서 **http://localhost:8080/api/characters/raw** 접속
   - 넥슨이 준 원본 JSON이 보이면 연결 성공 (여기서 응답 구조를 눈으로 확인할 수 있어요)
   - 에러가 나면 화면에 넥슨의 에러코드가 그대로 나옵니다 (예: OPENAPI00005 = 잘못된 API 키)
4. 메인 화면에서 "넥슨 API로 캐릭터 불러오기" 클릭

## 5. 프로젝트 구조
```
src/main/java/com/mymapleunion/
  MapleUnionApplication.java      실행 시작점
  controller/CharacterController  브라우저가 호출하는 주소 (/api/characters)
  service/NexonApiService         넥슨 API 호출 (API 키는 여기서만 사용)
  service/DemoData                키가 없을 때 보여줄 샘플
  dto/CharacterDto                캐릭터 1명 정보
src/main/resources/static/        화면 (index.html, css, js) - 부트스트랩 사용
```

## 6. 다음 단계 (아직 안 만든 것)
- SQLite 저장 (조정한 레벨/메모 보관)
- exe 포장 (jpackage), 실행 시 브라우저 자동 열기
- README 작성, GitHub 업로드
