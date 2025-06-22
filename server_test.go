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
	"github.com/suimi34/golang-graphql/database"
	"github.com/suimi34/golang-graphql/graph"
	"github.com/suimi34/golang-graphql/graph/model"
)

func TestGraphQLRequest(t *testing.T) {
	// GORM接続を初期化
	config := database.GetDBConfig("test")
	gormDB, err := database.ConnectGORM(config)
	if err != nil {
		t.Fatalf("GORM接続に失敗: %v", err)
	}

	// テスト用データをGORMで挿入
	testUser := database.User{
		ID:       1,
		Name:     "test",
		Email:    "test@example.com",
		Password: "password",
	}
	if err := gormDB.Save(&testUser).Error; err != nil {
		t.Fatalf("テストユーザーの挿入に失敗: %v", err)
	}

	// テスト用TODOをGORMで挿入
	testTodo := database.Todo{
		ID:     1,
		Text:   "test todo",
		Done:   false,
		UserID: 1,
	}
	if err := gormDB.Save(&testTodo).Error; err != nil {
		t.Fatalf("テストTODOの挿入に失敗: %v", err)
	}

	// テスト終了後にGORMでクリーンアップ
	defer func() {
		gormDB.Where("user_id IN ?", []uint{1, 123}).Delete(&database.Todo{})
		gormDB.Where("id IN ?", []uint{1, 123}).Delete(&database.User{})
	}()

	// gqlgenで生成されたExecutableSchemaからサーバーを作成
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: &graph.Resolver{GORMDB: gormDB}}))
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
				user {
					id
					name
					email
					createdAt
					updatedAt
				}
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

	// データが存在することを確認
	assert.True(t, len(res.Data.Todos) > 0, "todos should not be empty")
	assert.Equal(t, "1", res.Data.Todos[0].ID)
	assert.Equal(t, "test todo", res.Data.Todos[0].Text)
	assert.Equal(t, false, res.Data.Todos[0].Done)

	// ユーザー情報の確認
	assert.NotNil(t, res.Data.Todos[0].User)
	assert.Equal(t, "1", res.Data.Todos[0].User.ID)
	assert.Equal(t, "test", res.Data.Todos[0].User.Name)
	assert.Equal(t, "test@example.com", res.Data.Todos[0].User.Email)
	assert.NotEmpty(t, res.Data.Todos[0].User.CreatedAt)
	assert.NotEmpty(t, res.Data.Todos[0].User.UpdatedAt)
}

func TestCreateTodoMutation(t *testing.T) {
	// GORM接続を初期化
	config := database.GetDBConfig("test")
	gormDB, err := database.ConnectGORM(config)
	if err != nil {
		t.Fatalf("GORM接続に失敗: %v", err)
	}

	// テスト用ユーザーデータをGORMで挿入
	testUser := database.User{
		ID:       123,
		Name:     "Test User",
		Email:    "testuser@example.com",
		Password: "password",
	}
	if err := gormDB.Save(&testUser).Error; err != nil {
		t.Fatalf("テストユーザーの挿入に失敗: %v", err)
	}

	// テスト終了後にGORMでクリーンアップ
	defer func() {
		gormDB.Where("user_id IN ?", []uint{1, 123}).Delete(&database.Todo{})
		gormDB.Where("id IN ?", []uint{1, 123}).Delete(&database.User{})
	}()

	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: &graph.Resolver{GORMDB: gormDB}}))
	srv.AddTransport(transport.POST{})

	ts := httptest.NewServer(srv)
	defer ts.Close()

	url := ts.URL + `/query`

	mutation := `
		mutation {
			createTodo(input: {text: "New Todo Item", userId: "123"}) {
				id
				text
				done
				user {
					id
					name
				}
			}
		}`

	reqBody, err := json.Marshal(map[string]string{
		"query": mutation,
	})
	if err != nil {
		t.Fatalf("リクエストボディの生成に失敗: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		t.Fatalf("POSTリクエストの作成に失敗: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("POSTリクエストの送信に失敗: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("レスポンスの読み込みに失敗: %v", err)
	}

	var res struct {
		Data struct {
			CreateTodo model.Todo `json:"createTodo"`
		} `json:"data"`
	}

	t.Logf("レスポンス: %s", string(body))
	if err := json.Unmarshal(body, &res); err != nil {
		t.Fatalf("レスポンスのデコードに失敗: %v", err)
	}

	assert.NotEmpty(t, res.Data.CreateTodo.ID) // データベースで生成されたIDなので空でないことを確認
	assert.Equal(t, "New Todo Item", res.Data.CreateTodo.Text)
	assert.Equal(t, false, res.Data.CreateTodo.Done)
	assert.Equal(t, "123", res.Data.CreateTodo.User.ID)
	assert.Equal(t, "Test User", res.Data.CreateTodo.User.Name)

	// データベースに実際にTODOが作成されたことをGORMで確認
	var count int64
	if err := gormDB.Model(&database.Todo{}).Where("text = ? AND user_id = ?", "New Todo Item", 123).Count(&count).Error; err != nil {
		t.Fatalf("TODOカウント取得に失敗: %v", err)
	}
	assert.Equal(t, int64(1), count, "TODOがデータベースに作成されている必要があります")
}
