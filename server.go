package main

import (
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/suimi34/golang-graphql/database"
	"github.com/suimi34/golang-graphql/graph"
	"github.com/suimi34/golang-graphql/handlers"
	"github.com/vektah/gqlparser/v2/ast"
)

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

	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: &graph.Resolver{GORMDB: gormDB}}))

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})

	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))

	srv.Use(extension.Introspection{})
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	// 認証ハンドラーを初期化
	authHandler, err := handlers.NewAuthHandler(gormDB, env)
	if err != nil {
		log.Fatalf("認証ハンドラーの初期化に失敗: %v", err)
	}

	// 静的ファイルの配信（フロントエンドのビルド済みファイル）
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./frontend/dist/"))))

	// ユーザー登録ルート
	http.HandleFunc("/register", authHandler.ShowRegisterForm)

	// GraphQL playground is only available in development environment
	if env == "development" {
		http.Handle("/", playground.Handler("GraphQL playground", "/query"))
		log.Printf("connect to http://localhost:%s/ for GraphQL playground", port)
		log.Printf("User registration available at http://localhost:%s/register", port)
	} else {
		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
		})
		log.Printf("GraphQL server running on port %s (playground disabled)", port)
		log.Printf("User registration available at http://localhost:%s/register", port)
	}
	http.Handle("/query", srv)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
