package com.nexushealth.repository;

import com.nexushealth.entity.AccessCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccessCardRepository extends JpaRepository<AccessCard, String> {

    @Query("SELECT c FROM AccessCard c WHERE c.patientId = :patientId OR c.patientHealthId = :patientHealthId " +
            "ORDER BY c.issuedAt DESC")
    List<AccessCard> findForPatient(@Param("patientId") String patientId, @Param("patientHealthId") String patientHealthId);

    @Query("SELECT c FROM AccessCard c WHERE c.id = :cardId OR c.patientId = :patientId")
    Optional<AccessCard> findByIdOrPatientId(@Param("cardId") String cardId, @Param("patientId") String patientId);

    @Query("SELECT c FROM AccessCard c WHERE c.secureToken = :token OR c.patientHealthId = :token OR c.cardIdentifier = :token")
    Optional<AccessCard> findByAnyIdentifier(@Param("token") String token);
}
