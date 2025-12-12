package handlers

import (
	"embed"
	"html/template"
	"net/http"

	"github.com/gorilla/sessions"
)

type TodoHandler struct {
	Templates    *template.Template
	Env          string
	SessionStore *sessions.CookieStore
}

type TodosData struct {
	ShowPlayground bool
}

func NewTodoHandler(env string, templatesFS embed.FS, sessionStore *sessions.CookieStore) (*TodoHandler, error) {
	tmpl, err := template.ParseFS(templatesFS, "templates/*.html")
	if err != nil {
		return nil, err
	}

	return &TodoHandler{
		Templates:    tmpl,
		Env:          env,
		SessionStore: sessionStore,
	}, nil
}

func (h *TodoHandler) ShowTodosPage(w http.ResponseWriter, r *http.Request) {
	// セッションからログイン状態を確認
	session, err := h.SessionStore.Get(r, "session")
	if err != nil {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	// user_idがセッションに存在するか確認
	userID, ok := session.Values["user_id"]
	if !ok || userID == nil {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	data := TodosData{
		ShowPlayground: h.Env == "development",
	}

	if err := h.Templates.ExecuteTemplate(w, "todos.html", data); err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
}
