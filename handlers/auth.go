package handlers

import (
	"html/template"
	"net/http"
	"path/filepath"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/suimi34/golang-graphql/database"
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

func NewAuthHandler(db *gorm.DB, env string) (*AuthHandler, error) {
	// テンプレートを読み込み
	templatesPath := filepath.Join("templates", "*.html")
	tmpl, err := template.ParseGlob(templatesPath)
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

func (h *AuthHandler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.ShowRegisterForm(w, r)
		return
	}

	// フォームデータを取得
	name := strings.TrimSpace(r.FormValue("name"))
	email := strings.TrimSpace(r.FormValue("email"))
	password := r.FormValue("password")
	confirmPassword := r.FormValue("confirm_password")

	data := RegistrationData{
		Name:           name,
		Email:          email,
		ShowPlayground: h.Env == "development",
	}

	// バリデーション
	if name == "" || email == "" || password == "" {
		data.Error = "すべてのフィールドを入力してください"
		h.Templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	if password != confirmPassword {
		data.Error = "パスワードが一致しません"
		h.Templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	if len(password) < 6 {
		data.Error = "パスワードは6文字以上で入力してください"
		h.Templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	// メールアドレスの重複チェック
	var existingUser database.User
	if err := h.DB.Where("email = ?", email).First(&existingUser).Error; err == nil {
		data.Error = "このメールアドレスは既に登録されています"
		h.Templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	// パスワードのハッシュ化
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		data.Error = "パスワードの処理中にエラーが発生しました"
		h.Templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	// ユーザーを作成
	user := database.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	if err := h.DB.Create(&user).Error; err != nil {
		data.Error = "ユーザー登録中にエラーが発生しました"
		h.Templates.ExecuteTemplate(w, "register.html", data)
		return
	}

	// 成功ページを表示
	successData := RegistrationData{
		Name:           name,
		Email:          email,
		ShowPlayground: h.Env == "development",
	}

	if err := h.Templates.ExecuteTemplate(w, "success.html", successData); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
