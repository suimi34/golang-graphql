package handlers

import (
	"embed"
	"html/template"
	"net/http"

	"gorm.io/gorm"
)

type AuthHandler struct {
	DB        *gorm.DB
	Templates *template.Template
	Env       string
}

type RegistrationData struct {
	Name           string
	Email          string
	Error          string
	Success        string
	ShowPlayground bool
}

func NewAuthHandler(db *gorm.DB, env string, templatesFS embed.FS) (*AuthHandler, error) {
	// embedされたテンプレートを読み込み
	tmpl, err := template.ParseFS(templatesFS, "templates/*.html")
	if err != nil {
		return nil, err
	}

	return &AuthHandler{
		DB:        db,
		Templates: tmpl,
		Env:       env,
	}, nil
}

func (h *AuthHandler) ShowRegisterForm(w http.ResponseWriter, r *http.Request) {
	data := RegistrationData{
		ShowPlayground: h.Env == "development",
	}

	if err := h.Templates.ExecuteTemplate(w, "register.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}

type LoginData struct {
	Email          string
	Error          string
	ShowPlayground bool
}

func (h *AuthHandler) ShowLoginForm(w http.ResponseWriter, r *http.Request) {
	data := LoginData{
		ShowPlayground: h.Env == "development",
	}

	if err := h.Templates.ExecuteTemplate(w, "login.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
