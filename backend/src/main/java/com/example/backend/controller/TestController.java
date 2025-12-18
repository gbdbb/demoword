package com.example.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@Slf4j
public class TestController {

    @PostMapping("/echo")
    public String echo(@RequestBody String body) {
        log.info("收到请求体: {}", body);
        return "Echo: " + body;
    }
}