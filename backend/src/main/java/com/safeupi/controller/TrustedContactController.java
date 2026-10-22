package com.safeupi.controller;

import com.safeupi.config.JwtService;
import com.safeupi.dto.TrustedContactRequest;
import com.safeupi.model.TrustedContact;
import com.safeupi.service.TrustedContactService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contacts")
public class TrustedContactController {

    private final TrustedContactService trustedContactService;
    private final JwtService jwtService;

    public TrustedContactController(TrustedContactService trustedContactService, JwtService jwtService) {
        this.trustedContactService = trustedContactService;
        this.jwtService = jwtService;
    }

    private Long extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                return jwtService.extractUserId(authHeader.substring(7));
            } catch (Exception ignored) {}
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getContacts(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required to view trusted contacts."));
        }
        List<TrustedContact> contacts = trustedContactService.getUserContacts(userId);
        return ResponseEntity.ok(contacts);
    }

    @PostMapping
    public ResponseEntity<?> addContact(@Valid @RequestBody TrustedContactRequest request,
                                        @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required to add trusted contacts."));
        }
        try {
            TrustedContact created = trustedContactService.addContact(request, userId);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to add contact: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContact(@PathVariable Long id,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = extractUserId(authHeader);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required."));
        }
        trustedContactService.deleteContact(id, userId);
        return ResponseEntity.ok(Map.of("message", "Contact deleted."));
    }
}
