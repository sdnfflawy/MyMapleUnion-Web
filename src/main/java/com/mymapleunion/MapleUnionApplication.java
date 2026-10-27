package com.mymapleunion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MapleUnionApplication {

    public static void main(String[] args) {
        // exe로 실행했는데 이미 실행 중이면(두 번 더블클릭 등) 서버를 또 띄우지 않고 브라우저만 엽니다
        if (Boolean.getBoolean("app.open-browser") && BrowserLauncher.isPortInUse(BrowserLauncher.PORT)) {
            BrowserLauncher.open(BrowserLauncher.URL);
            return;
        }
        SpringApplication.run(MapleUnionApplication.class, args);
    }
}
