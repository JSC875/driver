// 1. Rides.java (DTO/Entity)
package com.cruzze.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rides")
public class Rides {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "clerk_user_id", referencedColumnName = "clerk_user_id")
    private Users user;

  
    
    @Column(name = "clerk_driver_id", nullable = true)
    private String clerkDriverId; // ✅ Store Clerk Driver ID directly
    
    @Column(name = "pickup_latitude", precision = 10, scale = 8)
    private BigDecimal pickupLatitude;

    @Column(name = "pickup_longitude", precision = 11, scale = 8)
    private BigDecimal pickupLongitude;

    @Column(name = "drop_latitude", precision = 10, scale = 8)
    private BigDecimal dropLatitude;

    @Column(name = "drop_longitude", precision = 11, scale = 8)
    private BigDecimal dropLongitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RideStatus status = RideStatus.PENDING;

    @Column(name = "vehicle_type")
    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "fare", precision = 10, scale = 2)
    private BigDecimal fare;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "payment_mode")
    private String paymentMode; // e.g., "CASH", "UPI", "WALLET"
    
    
    public enum PaymentStatus {
        PENDING, PAID, FAILED
    }


    public enum RideStatus {
        PENDING, ACCEPTED, STARTED, COMPLETED, CANCELLED
    }

    public enum VehicleType {
        BIKE, AUTO, CAB, PARCEL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters omitted for brevity
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Users getUser() {
		return user;
	}

	public void setUser(Users user) {
		this.user = user;
	}
	

	public BigDecimal getFare() {
		return fare;
	}

	public void setFare(BigDecimal fare) {
		this.fare = fare;
	}

	
	public PaymentStatus getPaymentStatus() {
		return paymentStatus;
	}

	public void setPaymentStatus(PaymentStatus paymentStatus) {
		this.paymentStatus = paymentStatus;
	}

	public String getPaymentMode() {
		return paymentMode;
	}

	public void setPaymentMode(String paymentMode) {
		this.paymentMode = paymentMode;
	}

	

	public BigDecimal getPickupLatitude() {
		return pickupLatitude;
	}

	public void setPickupLatitude(BigDecimal pickupLatitude) {
		this.pickupLatitude = pickupLatitude;
	}

	public BigDecimal getPickupLongitude() {
		return pickupLongitude;
	}

	public void setPickupLongitude(BigDecimal pickupLongitude) {
		this.pickupLongitude = pickupLongitude;
	}

	public BigDecimal getDropLatitude() {
		return dropLatitude;
	}

	public void setDropLatitude(BigDecimal dropLatitude) {
		this.dropLatitude = dropLatitude;
	}

	public BigDecimal getDropLongitude() {
		return dropLongitude;
	}

	public void setDropLongitude(BigDecimal dropLongitude) {
		this.dropLongitude = dropLongitude;
	}

	public RideStatus getStatus() {
		return status;
	}

	public void setStatus(RideStatus status) {
		this.status = status;
	}

	public VehicleType getVehicleType() {
		return vehicleType;
	}

	public void setVehicleType(VehicleType vehicleType) {
		this.vehicleType = vehicleType;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	public String getClerkDriverId() {
		return clerkDriverId;
	}

	public void setClerkDriverId(String clerkDriverId) {
		this.clerkDriverId = clerkDriverId;
	}


    
    
}