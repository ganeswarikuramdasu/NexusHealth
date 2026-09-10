package com.nexushealth.repository;

import com.nexushealth.entity.WarningMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WarningMessageRepository extends JpaRepository<WarningMessage, String> {

    List<WarningMessage> findAllByOrderByCreatedAtDesc();

    @Query("SELECT w FROM WarningMessage w WHERE w.active = true " +
            "AND (w.targetRole = :role OR w.targetRole = 'ALL') " +
            "AND (w.targetModule IS NULL OR w.targetModule = '' OR w.targetModule = 'GENERAL' OR w.targetModule = :module) " +
            "AND (w.expiresAt IS NULL OR w.expiresAt > CURRENT_TIMESTAMP) " +
            "ORDER BY w.createdAt DESC")
    List<WarningMessage> findVisible(@Param("role") String role, @Param("module") String module);
}