import { useState } from 'react';
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('/query');

const LOGIN_USER_MUTATION = gql`
  mutation LoginUser($input: LoginUserInput!) {
    loginUser(input: $input) {
      success
      message
      user {
        id
        name
        email
        createdAt
      }
    }
  }
`;

const UserLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // クライアントサイドバリデーション
    if (!formData.email || !formData.password) {
      setMessage('メールアドレスとパスワードを入力してください');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    try {
      const variables = {
        input: {
          email: formData.email,
          password: formData.password
        }
      };

      const response = await client.request(LOGIN_USER_MUTATION, variables);

      if (response.loginUser.success) {
        setMessage(response.loginUser.message);
        setIsSuccess(true);
        setLoggedInUser(response.loginUser.user);
        // ログイン成功後、Todo一覧ページにリダイレクト
        setTimeout(() => {
          window.location.href = '/todos';
        }, 1500);
      } else {
        setMessage(response.loginUser.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('ログイン中にエラーが発生しました');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    title: {
      textAlign: 'center',
      color: '#333',
      marginBottom: '30px'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      color: '#555',
      fontWeight: 'bold'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: loading ? '#6c757d' : '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: loading ? 'not-allowed' : 'pointer'
    },
    message: {
      marginTop: '15px',
      padding: '10px',
      borderRadius: '4px',
      backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
      color: isSuccess ? '#155724' : '#721c24',
      border: `1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'}`
    },
    successInfo: {
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px'
    },
    buttonGroup: {
      marginTop: '20px',
      display: 'flex',
      gap: '10px'
    },
    secondaryButton: {
      flex: 1,
      padding: '10px 20px',
      backgroundColor: '#6c757d',
      color: 'white',
      textDecoration: 'none',
      borderRadius: '4px',
      textAlign: 'center',
      fontSize: '14px'
    },
    linkText: {
      textAlign: 'center',
      marginTop: '20px',
      color: '#666'
    },
    link: {
      color: '#007bff',
      textDecoration: 'none'
    }
  };

  if (isSuccess && loggedInUser) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>✅ ログイン成功</h1>
        <p style={{textAlign: 'center', marginBottom: '20px'}}>
          ログインしました。
        </p>

        <div style={styles.successInfo}>
          <strong>ユーザー情報:</strong><br />
          名前: {loggedInUser.name}<br />
          メールアドレス: {loggedInUser.email}<br />
          登録日時: {new Date(loggedInUser.createdAt).toLocaleString('ja-JP')}
        </div>

        <p style={{textAlign: 'center', margin: '20px 0', color: '#28a745'}}>
          Todo一覧ページに移動します...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ログイン</h1>

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="email">メールアドレス:</label>
          <input
            style={styles.input}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="password">パスワード:</label>
          <input
            style={styles.input}
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          style={styles.button}
          disabled={loading}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <p style={styles.linkText}>
        アカウントをお持ちでない方は <a href="/register" style={styles.link}>新規登録</a>
      </p>
    </div>
  );
};

export default UserLogin;

