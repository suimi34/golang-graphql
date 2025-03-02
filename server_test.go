package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/suimi34/golang-graphql/graph"
	"github.com/suimi34/golang-graphql/graph/model"
)

func TestGraphQLRequest(t *testing.T) {
	// gqlgenで生成されたExecutableSchemaからサーバーを作成
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: &graph.Resolver{}}))
	srv.AddTransport(transport.POST{})

	// httptestでテスト用サーバーを作成
	ts := httptest.NewServer(srv)
	defer ts.Close()

	url := ts.URL + `/query`

	// GraphQLクエリのペイロードを用意
	reqBody, err := json.Marshal(map[string]string{
		"query": `{
			todos {
				id
				text
				done
			}
		}`,
	})
	if err != nil {
		t.Fatalf("リクエストボディの生成に失敗: %v", err)
	}

	// HTTP POSTリクエストを作成
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		t.Fatalf("POSTリクエストの作成に失敗: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// HTTPクライアントを使用してリクエストを送信
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("POSTリクエストの送信に失敗: %v", err)
	}
	defer resp.Body.Close()

	// レスポンスボディの読み込み
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("レスポンスの読み込みに失敗: %v", err)
	}

	var res struct {
		Data struct {
			Todos []model.Todo `json:"todos"`
		} `json:"data"`
	}

	// レスポンス内容の検証
	t.Logf("レスポンス: %s", string(body))
	if err := json.Unmarshal(body, &res); err != nil {
		t.Fatalf("レスポンスのデコードに失敗: %v", err)
	}

	assert.Equal(t, res.Data.Todos[0].ID, "1")
	assert.Equal(t, res.Data.Todos[0].Text, "test")
	assert.Equal(t, res.Data.Todos[0].Done, false)
}
