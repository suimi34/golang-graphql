package main

import (
	"crypto/rand"
	"embed"
	"encoding/base64"
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gorilla/sessions"
	"github.com/suimi34/golang-graphql/database"
	"github.com/suimi34/golang-graphql/graph"
	"github.com/suimi34/golang-graphql/handlers"
	"github.com/vektah/gqlparser/v2/ast"
)

//go:embed templates/*.html
var templatesFS embed.FS

const defaultPort = "8080"

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// GORM接続を初期化
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}
	config := database.GetDBConfig(env)
	gormDB, err := database.ConnectGORM(config)
	if err != nil {
		log.Fatalf("GORM接続に失敗: %v", err)
	}

	// セッションストアを初期化
	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		// デフォルトのランダムシークレットを生成
		secretBytes := make([]byte, 32)
		if _, err := rand.Read(secretBytes); err != nil {
			log.Fatalf("セッションシークレットの生成に失敗: %v", err)
		}
		sessionSecret = base64.StdEncoding.EncodeToString(secretBytes)
		log.Println("警告: SESSION_SECRET が設定されていないため、ランダムシークレットを生成しました")
	}
	sessionStore := sessions.NewCookieStore([]byte(sessionSecret))
	sessionStore.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400, // 24時間
		HttpOnly: true,
		Secure:   env == "production",
		SameSite: http.SameSiteLaxMode,
	}

	resolver := &graph.Resolver{
		GORMDB:       gormDB,
		SessionStore: sessionStore,
	}
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})

	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))

	srv.Use(extension.Introspection{})
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	// 認証ハンドラーを初期化
	authHandler, err := handlers.NewAuthHandler(gormDB, env, templatesFS, sessionStore)
	if err != nil {
		log.Fatalf("認証ハンドラーの初期化に失敗: %v", err)
	}

	// Todoハンドラーを初期化
	todoHandler, err := handlers.NewTodoHandler(env, templatesFS, sessionStore)
	if err != nil {
		log.Fatalf("Todoハンドラーの初期化に失敗: %v", err)
	}

	// 静的ファイルの配信（フロントエンドのビルド済みファイル）
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./frontend/dist/"))))

	// ユーザー登録ルート
	http.HandleFunc("/register", authHandler.ShowRegisterForm)

	// ログインルート
	http.HandleFunc("/login", authHandler.ShowLoginForm)

	// Todo一覧ルート
	http.HandleFunc("/todos", todoHandler.ShowTodosPage)

	// GraphQL playground is only available in development environment
	if env == "development" {
		http.Handle("/", playground.Handler("GraphQL playground", "/query"))
		log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
		log.Printf("User registration available at http://localhost:%s/register", port)
		log.Printf("Login available at http://localhost:%s/login", port)
		log.Printf("Todo list available at http://localhost:%s/todos", port)
	} else {
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
		})
		log.Printf("GraphQL server running on port %s (playground disabled)", port)
		log.Printf("User registration available at http://localhost:%s/register", port)
		log.Printf("Login available at http://localhost:%s/login", port)
		log.Printf("Todo list available at http://localhost:%s/todos", port)
	}
	// GraphQLハンドラーにHTTPコンテキストを渡すラッパー
	http.HandleFunc("/query", func(w http.ResponseWriter, r *http.Request) {
		ctx := graph.WithHTTPContext(r.Context(), r, w)
		srv.ServeHTTP(w, r.WithContext(ctx))
	})
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
