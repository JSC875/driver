package com.cruzze.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ratings", uniqueConstraints = {
    @UniqueConstraint(columnNames = "ride_id")
})
public class Ratings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ride_id", nullable = false)
    private Rides ride;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "driver_id", nullable = false)
    private Drivers driver;

    @Column(name = "user_rating")
    private Integer userRating;

    @Column(name = "driver_rating")
    private Integer driverRating;

    @Column(name = "user_feedback", columnDefinition = "TEXT")
    private String userFeedback;

    @Column(name = "driver_feedback", columnDefinition = "TEXT")
    private String driverFeedback;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Rides getRide() {
		return ride;
	}

	public void setRide(Rides ride) {
		this.ride = ride;
	}

	public Users getUser() {
		return user;
	}

	public void setUser(Users user) {
		this.user = user;
	}

	public Drivers getDriver() {
		return driver;
	}

	public void setDriver(Drivers driver) {
		this.driver = driver;
	}

	public Integer getUserRating() {
		return userRating;
	}

	public void setUserRating(Integer userRating) {
		this.userRating = userRating;
	}

	public Integer getDriverRating() {
		return driverRating;
	}

	public void setDriverRating(Integer driverRating) {
		this.driverRating = driverRating;
	}

	public String getUserFeedback() {
		return userFeedback;
	}

	public void setUserFeedback(String userFeedback) {
		this.userFeedback = userFeedback;
	}

	public String getDriverFeedback() {
		return driverFeedback;
	}

	public void setDriverFeedback(String driverFeedback) {
		this.driverFeedback = driverFeedback;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

    

    // You may also want to add validation manually in your service layer like:
    // if (userRating < 1 || userRating > 5) throw new IllegalArgumentException("Rating must be between 1 and 5");
}
