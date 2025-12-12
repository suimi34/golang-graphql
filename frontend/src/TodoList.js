import { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('/query');

const GET_TODOS_QUERY = gql`
  query GetTodos {
    todos {
      id
      text
      done
      user {
        id
        name
      }
    }
  }
`;

const CREATE_TODO_MUTATION = gql`
  mutation CreateTodo($input: NewTodo!) {
    createTodo(input: $input) {
      id
      text
      done
      user {
        id
        name
      }
    }
  }
`;

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTodoText, setNewTodoText] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await client.request(GET_TODOS_QUERY);
      setTodos(response.todos || []);
      setError('');
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Todoの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) {
      setError('Todoを入力してください');
      return;
    }

    try {
      setCreating(true);
      const response = await client.request(CREATE_TODO_MUTATION, {
        input: {
          text: newTodoText
        }
      });
      setTodos([response.createTodo, ...todos]);
      setNewTodoText('');
      setError('');
    } catch (err) {
      console.error('Error creating todo:', err);
      setError('Todoの作成に失敗しました。ログインしているか確認してください。');
    } finally {
      setCreating(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '30px auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      paddingBottom: '15px',
      borderBottom: '2px solid #e0e0e0'
    },
    title: {
      color: '#333',
      margin: 0
    },
    nav: {
      display: 'flex',
      gap: '10px'
    },
    navLink: {
      padding: '8px 16px',
      backgroundColor: '#6c757d',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '4px',
      fontSize: '14px'
    },
    logoutLink: {
      padding: '8px 16px',
      backgroundColor: '#dc3545',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '4px',
      fontSize: '14px'
    },
    form: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    },
    formTitle: {
      margin: '0 0 15px 0',
      color: '#333',
      fontSize: '18px'
    },
    formRow: {
      display: 'flex',
      gap: '10px',
      marginBottom: '10px'
    },
    input: {
      flex: 1,
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer'
    },
    buttonDisabled: {
      padding: '10px 20px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'not-allowed'
    },
    error: {
      padding: '10px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '4px',
      marginBottom: '20px',
      border: '1px solid #f5c6cb'
    },
    todoList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    todoItem: {
      backgroundColor: 'white',
      padding: '15px 20px',
      marginBottom: '10px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    todoText: {
      fontSize: '16px',
      color: '#333'
    },
    todoDone: {
      textDecoration: 'line-through',
      color: '#999'
    },
    todoMeta: {
      fontSize: '12px',
      color: '#666'
    },
    emptyMessage: {
      textAlign: 'center',
      color: '#666',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    loadingMessage: {
      textAlign: 'center',
      color: '#666',
      padding: '40px'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>📝 Todo一覧</h1>
        <nav style={styles.nav}>
          <a href="/login" style={styles.logoutLink}>ログアウト</a>
        </nav>
      </header>

      <div style={styles.form}>
        <h2 style={styles.formTitle}>新しいTodoを追加</h2>
        <form onSubmit={handleCreateTodo}>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Todoを入力..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              style={styles.input}
              disabled={creating}
            />
            <button
              type="submit"
              style={creating ? styles.buttonDisabled : styles.button}
              disabled={creating}
            >
              {creating ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loadingMessage}>読み込み中...</div>
      ) : todos.length === 0 ? (
        <div style={styles.emptyMessage}>
          <p>まだTodoがありません。</p>
          <p>上のフォームから新しいTodoを追加してください。</p>
        </div>
      ) : (
        <ul style={styles.todoList}>
          {todos.map((todo) => (
            <li key={todo.id} style={styles.todoItem}>
              <div>
                <span style={todo.done ? {...styles.todoText, ...styles.todoDone} : styles.todoText}>
                  {todo.done ? '✅ ' : '⬜ '}{todo.text}
                </span>
                <div style={styles.todoMeta}>
                  作成者: {todo.user.name} (ID: {todo.user.id})
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;

