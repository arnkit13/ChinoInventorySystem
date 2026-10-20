package com.chino.inventory_backend.controller;

import com.chino.inventory_backend.dto.SupabaseConfigDto;
import com.chino.inventory_backend.service.SupabaseConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config/supabase")
public class SupabaseConfigController {

    private final SupabaseConfigService supabaseConfigService;

    public SupabaseConfigController(SupabaseConfigService supabaseConfigService) {
        this.supabaseConfigService = supabaseConfigService;
    }

    @GetMapping
    public ResponseEntity<SupabaseConfigDto> getConfig() {
        return ResponseEntity.ok(supabaseConfigService.getConfig());
    }

    @PostMapping
    public ResponseEntity<SupabaseConfigDto> saveAndTestConfig(@RequestBody SupabaseConfigDto dto) {
        SupabaseConfigDto result = supabaseConfigService.saveAndTestConfig(dto);
        return ResponseEntity.ok(result);
    }
}
