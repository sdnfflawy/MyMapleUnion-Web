package com.mymapleunion;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 서버가 준비되면 기본 브라우저를 자동으로 엽니다.
 * -Dapp.open-browser=true 로 실행했을 때만 동작 (exe로 포장할 때 켬, 이클립스 개발 중에는 꺼짐).
 */
@Component
public class BrowserLauncher {

    /** application.properties 의 server.port 와 같아야 합니다 */
    public static final int PORT = 10544;
    public static final String URL = "http://localhost:" + PORT;

    @Value("${app.open-browser:false}")
    private boolean openBrowser;

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        if (openBrowser) {
            open(URL);
        }
    }

    /** 이 PC의 해당 포트를 이미 다른 프로그램(또는 이미 실행 중인 이 프로그램)이 쓰고 있는지 */
    public static boolean isPortInUse(int port) {
        try (ServerSocket socket = new ServerSocket(port, 1, InetAddress.getByName("127.0.0.1"))) {
            return false;
        } catch (IOException e) {
            return true;
        }
    }

    public static void open(String url) {
        String os = System.getProperty("os.name", "").toLowerCase();
        try {
            if (os.contains("win")) {
                new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
            } else if (os.contains("mac")) {
                new ProcessBuilder("open", url).start();
            } else {
                new ProcessBuilder("xdg-open", url).start();
            }
        } catch (IOException e) {
            System.err.println("Could not open the browser automatically. Open this address yourself: " + url);
        }
    }
}
