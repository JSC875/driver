package com.cruzze.config;

import com.corundumstudio.socketio.protocol.JacksonJsonSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.lang.reflect.Field;

public class CustomJacksonJsonSupport extends JacksonJsonSupport {

    public CustomJacksonJsonSupport() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());

            Field objectMapperField = JacksonJsonSupport.class.getDeclaredField("objectMapper");
            objectMapperField.setAccessible(true);
            objectMapperField.set(this, mapper);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
