package com.cruzze.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_earnings")
public class Driver_Earnings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "driver_id", nullable = false)
    private Drivers driver;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ride_id", nullable = false)
    private Rides ride;

    @Column(name = "gross_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal grossAmount;

    @Column(name = "commission_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal commissionRate;

    @Column(name = "commission_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal commissionAmount;

    @Column(name = "net_earnings", precision = 10, scale = 2, nullable = false)
    private BigDecimal netEarnings;

    @Column(name = "incentive_amount", precision = 10, scale = 2)
    private BigDecimal incentiveAmount = BigDecimal.ZERO;

    @Column(name = "total_earnings", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalEarnings;

    @Enumerated(EnumType.STRING)
    @Column(name = "payout_status", nullable = false)
    private PayoutStatus payoutStatus = PayoutStatus.PENDING;

    @Column(name = "payout_date")
    private LocalDateTime payoutDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum PayoutStatus {
        PENDING,
        PAID,
        HOLD
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Drivers getDriver() {
		return driver;
	}

	public void setDriver(Drivers driver) {
		this.driver = driver;
	}

	public Rides getRide() {
		return ride;
	}

	public void setRide(Rides ride) {
		this.ride = ride;
	}

	public BigDecimal getGrossAmount() {
		return grossAmount;
	}

	public void setGrossAmount(BigDecimal grossAmount) {
		this.grossAmount = grossAmount;
	}

	public BigDecimal getCommissionRate() {
		return commissionRate;
	}

	public void setCommissionRate(BigDecimal commissionRate) {
		this.commissionRate = commissionRate;
	}

	public BigDecimal getCommissionAmount() {
		return commissionAmount;
	}

	public void setCommissionAmount(BigDecimal commissionAmount) {
		this.commissionAmount = commissionAmount;
	}

	public BigDecimal getNetEarnings() {
		return netEarnings;
	}

	public void setNetEarnings(BigDecimal netEarnings) {
		this.netEarnings = netEarnings;
	}

	public BigDecimal getIncentiveAmount() {
		return incentiveAmount;
	}

	public void setIncentiveAmount(BigDecimal incentiveAmount) {
		this.incentiveAmount = incentiveAmount;
	}

	public BigDecimal getTotalEarnings() {
		return totalEarnings;
	}

	public void setTotalEarnings(BigDecimal totalEarnings) {
		this.totalEarnings = totalEarnings;
	}

	public PayoutStatus getPayoutStatus() {
		return payoutStatus;
	}

	public void setPayoutStatus(PayoutStatus payoutStatus) {
		this.payoutStatus = payoutStatus;
	}

	public LocalDateTime getPayoutDate() {
		return payoutDate;
	}

	public void setPayoutDate(LocalDateTime payoutDate) {
		this.payoutDate = payoutDate;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

    
}
