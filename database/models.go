package database

import (
	"time"
)

// User represents the users table
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Todos []Todo `gorm:"foreignKey:UserID" json:"todos,omitempty"`
}

// Todo represents the todos table
type Todo struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Text      string    `gorm:"not null" json:"text"`
	Done      bool      `gorm:"default:false" json:"done"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
