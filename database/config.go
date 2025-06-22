package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
}

func GetDBConfig(env string) Config {
	if env == "test" {
		return Config{
			Host:     getEnv("TEST_DB_HOST", "127.0.0.1"),
			Port:     getEnv("TEST_DB_PORT", "3307"),
			User:     getEnv("TEST_DB_USER", "root"),
			Password: getEnv("TEST_DB_PASSWORD", "root"),
			Database: getEnv("TEST_DB_NAME", "graphql_test_db"),
		}
	}

	return Config{
		Host:     getEnv("DB_HOST", "127.0.0.1"),
		Port:     getEnv("DB_PORT", "3306"),
		User:     getEnv("DB_USER", "root"),
		Password: getEnv("DB_PASSWORD", "root"),
		Database: getEnv("DB_NAME", "graphql_db"),
	}
}

func ConnectDB(config Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		config.User, config.Password, config.Host, config.Port, config.Database)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func ConnectGORM(config Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.User, config.Password, config.Host, config.Port, config.Database)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
