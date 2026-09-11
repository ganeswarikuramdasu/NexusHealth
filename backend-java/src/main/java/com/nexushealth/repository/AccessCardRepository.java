package com.nexushealth.repository;

import com.nexushealth.entity.AccessCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccessCardRepository extends JpaRepository<AccessCard, String> {

    @Query("SELECT c FROM AccessCard c WHERE c.patientId = :patientId OR c.patientHealthId = :patientHealthId " +
            "ORDER BY c.issuedAt DESC")
    List<AccessCard> findForPatient(@Param("patientId") String patientId, @Param("patientHealthId") String patientHealthId);

    @Query("SELECT c FROM AccessCard c WHERE c.id = :cardId OR c.patientId = :patientId " +
            "ORDER BY c.issuedAt DESC")
    List<AccessCard> findAllByIdOrPatientId(@Param("cardId") String cardId, @Param("patientId") String patientId);

    @Query("SELECT c FROM AccessCard c WHERE c.secureToken = :token OR c.patientHealthId = :token OR c.cardIdentifier = :token " +
            "ORDER BY c.issuedAt DESC")
    List<AccessCard> findAllByAnyIdentifier(@Param("token") String token);

    /**
     * Card-credential lookup that matches ONLY access-card identifiers
     * (card id / cardIdentifier / secureToken). A raw patient ID or Global
     * Health ID must never be accepted as a card credential.
     */
    @Query("SELECT c FROM AccessCard c WHERE c.id = :token OR c.secureToken = :token OR c.cardIdentifier = :token " +
            "ORDER BY c.issuedAt DESC")
    List<AccessCard> findAllByCardIdentifier(@Param("token") String token);
}
