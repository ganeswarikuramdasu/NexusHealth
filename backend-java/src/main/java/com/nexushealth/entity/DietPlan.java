package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diet_plans", indexes = {
    @Index(name = "idx_diet_plan_patient_id", columnList = "patient_id"),
    @Index(name = "idx_diet_plan_doctor_id", columnList = "doctor_id"),
    @Index(name = "idx_diet_plan_health_id", columnList = "patient_health_id"),
    @Index(name = "idx_diet_plan_created", columnList = "created_date")
})
public class DietPlan {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_diet_patient"))
    private User patient;

    @Column(name = "patient_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id", nullable = false)
    private String patientHealthId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_diet_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", insertable = false, updatable = false, length = 64)
    private String doctorId;

    @Column(name = "doctor_name")
    private String doctorName;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(name = "created_date", nullable = false, updatable = false)
    private LocalDate createdDate = LocalDate.now();

    @Column(name = "daily_calories_target")
    private String dailyCaloriesTarget;

    @Column(name = "water_intake_liters")
    private Double waterIntakeLiters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meals", columnDefinition = "JSON")
    private Meals meals = new Meals();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "restricted_foods", columnDefinition = "JSON")
    private List<String> restrictedFoods = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recommended_foods", columnDefinition = "JSON")
    private List<String> recommendedFoods = new ArrayList<>();

    @Column(name = "doctor_advice", columnDefinition = "TEXT")
    private String doctorAdvice;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public DietPlan() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.createdDate == null) this.createdDate = LocalDate.now();
    }

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public LocalDate getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDate createdDate) { this.createdDate = createdDate; }
    public String getDailyCaloriesTarget() { return dailyCaloriesTarget; }
    public void setDailyCaloriesTarget(String dailyCaloriesTarget) { this.dailyCaloriesTarget = dailyCaloriesTarget; }
    public Double getWaterIntakeLiters() { return waterIntakeLiters; }
    public void setWaterIntakeLiters(Double waterIntakeLiters) { this.waterIntakeLiters = waterIntakeLiters; }
    public Meals getMeals() { return meals; }
    public void setMeals(Meals meals) { this.meals = meals; }
    public List<String> getRestrictedFoods() { return restrictedFoods; }
    public void setRestrictedFoods(List<String> restrictedFoods) { this.restrictedFoods = restrictedFoods; }
    public List<String> getRecommendedFoods() { return recommendedFoods; }
    public void setRecommendedFoods(List<String> recommendedFoods) { this.recommendedFoods = recommendedFoods; }
    public String getDoctorAdvice() { return doctorAdvice; }
    public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static class Meals {
        private String breakfast;
        private String lunch;
        private String eveningSnack;
        private String dinner;

        public Meals() {}
        public String getBreakfast() { return breakfast; }
        public void setBreakfast(String breakfast) { this.breakfast = breakfast; }
        public String getLunch() { return lunch; }
        public void setLunch(String lunch) { this.lunch = lunch; }
        public String getEveningSnack() { return eveningSnack; }
        public void setEveningSnack(String eveningSnack) { this.eveningSnack = eveningSnack; }
        public String getDinner() { return dinner; }
        public void setDinner(String dinner) { this.dinner = dinner; }
    }

    public static class Builder {
        private final DietPlan d = new DietPlan();
        public Builder id(String id) { d.id = id; return this; }
        public Builder patient(User patient) { d.patient = patient; d.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { d.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { d.patientHealthId = patientHealthId; return this; }
        public Builder doctor(Doctor doctor) { d.doctor = doctor; d.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { d.doctorId = doctorId; return this; }
        public Builder doctorName(String doctorName) { d.doctorName = doctorName; return this; }
        public Builder hospitalName(String hospitalName) { d.hospitalName = hospitalName; return this; }
        public Builder title(String title) { d.title = title; return this; }
        public Builder category(String category) { d.category = category; return this; }
        public Builder dailyCaloriesTarget(String dailyCaloriesTarget) { d.dailyCaloriesTarget = dailyCaloriesTarget; return this; }
        public Builder waterIntakeLiters(Double waterIntakeLiters) { d.waterIntakeLiters = waterIntakeLiters; return this; }
        public Builder meals(Meals meals) { d.meals = meals; return this; }
        public Builder restrictedFoods(List<String> restrictedFoods) { d.restrictedFoods = restrictedFoods; return this; }
        public Builder recommendedFoods(List<String> recommendedFoods) { d.recommendedFoods = recommendedFoods; return this; }
        public Builder doctorAdvice(String doctorAdvice) { d.doctorAdvice = doctorAdvice; return this; }
        public DietPlan build() { return d; }
    }
}
