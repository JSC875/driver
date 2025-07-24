package com.cruzze.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
@org.springframework.context.annotation.Configuration


public class SocketConfig {

    @Value("${SOCKET_HOST:0.0.0.0}")
    private String socketHost;

    @Value("${SOCKET_PORT:${SOCKETIO_PORT:9092}}")
    private int socketPort;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(socketHost);
        config.setPort(socketPort);
        
        // Set the custom JSON support with proper LocalDate handling
        config.setJsonSupport(new CustomJacksonJsonSupport());

        return new SocketIOServer(config);
    }
}
