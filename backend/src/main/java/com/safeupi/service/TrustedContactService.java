package com.safeupi.service;

import com.safeupi.dto.TrustedContactRequest;
import com.safeupi.model.TrustedContact;
import com.safeupi.model.User;
import com.safeupi.repository.TrustedContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TrustedContactService {

    private final TrustedContactRepository trustedContactRepository;
    private final UserService userService;

    public TrustedContactService(TrustedContactRepository trustedContactRepository,
                                 UserService userService) {
        this.trustedContactRepository = trustedContactRepository;
        this.userService = userService;
    }

    public List<TrustedContact> getUserContacts(Long userId) {
        return trustedContactRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public TrustedContact addContact(TrustedContactRequest req, Long userId) {
        User user = userService.getUserEntity(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not authenticated.");
        }

        TrustedContact contact = new TrustedContact(
                user,
                req.getContactName().trim(),
                req.getPhoneNumber().trim(),
                req.getRelation() != null ? req.getRelation().trim() : "",
                req.getEmail() != null ? req.getEmail().trim() : ""
        );

        return trustedContactRepository.save(contact);
    }

    @Transactional
    public void deleteContact(Long contactId, Long userId) {
        trustedContactRepository.deleteByIdAndUserId(contactId, userId);
    }
}
