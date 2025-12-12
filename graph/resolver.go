package graph

import (
	"context"
	"net/http"

	"github.com/gorilla/sessions"
	"gorm.io/gorm"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	GORMDB       *gorm.DB
	SessionStore *sessions.CookieStore
}

// コンテキストキー
type contextKey string

const (
	httpRequestKey  contextKey = "httpRequest"
	httpResponseKey contextKey = "httpResponse"
)

// HTTPリクエスト/レスポンスをコンテキストに追加
func WithHTTPContext(ctx context.Context, r *http.Request, w http.ResponseWriter) context.Context {
	ctx = context.WithValue(ctx, httpRequestKey, r)
	ctx = context.WithValue(ctx, httpResponseKey, w)
	return ctx
}

// コンテキストからHTTPリクエストを取得
func GetHTTPRequest(ctx context.Context) *http.Request {
	r, _ := ctx.Value(httpRequestKey).(*http.Request)
	return r
}

// コンテキストからHTTPレスポンスを取得
func GetHTTPResponse(ctx context.Context) http.ResponseWriter {
	w, _ := ctx.Value(httpResponseKey).(http.ResponseWriter)
	return w
}
