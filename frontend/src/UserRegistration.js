import { useState } from 'react';
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('/query');

const REGISTER_USER_MUTATION = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
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

const UserRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

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
    if (!formData.name || !formData.email || !formData.password) {
      setMessage('すべてのフィールドを入力してください');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('パスワードが一致しません');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage('パスワードは6文字以上で入力してください');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    try {
      const variables = {
        input: {
          name: formData.name,
          email: formData.email,
          password: formData.password
        }
      };

      const response = await client.request(REGISTER_USER_MUTATION, variables);

      if (response.registerUser.success) {
        setMessage(response.registerUser.message);
        setIsSuccess(true);
        setRegisteredUser(response.registerUser.user);
        // 登録成功後、Todo一覧ページにリダイレクト
        setTimeout(() => {
          window.location.href = '/todos';
        }, 1500);
      } else {
        setMessage(response.registerUser.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('登録中にエラーが発生しました');
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
      backgroundColor: loading ? '#6c757d' : '#007bff',
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
    }
  };

  if (isSuccess && registeredUser) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>✅ 登録完了</h1>
        <p style={{textAlign: 'center', marginBottom: '20px'}}>
          ユーザー登録が正常に完了しました。
        </p>

        <div style={styles.successInfo}>
          <strong>登録情報:</strong><br />
          名前: {registeredUser.name}<br />
          メールアドレス: {registeredUser.email}<br />
          登録日時: {new Date(registeredUser.createdAt).toLocaleString('ja-JP')}
        </div>

        <p style={{textAlign: 'center', margin: '20px 0', color: '#28a745'}}>
          Todo一覧ページに移動します...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ユーザー登録</h1>

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="name">名前:</label>
          <input
            style={styles.input}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

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

        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="confirmPassword">パスワード確認:</label>
          <input
            style={styles.input}
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
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
          {loading ? '登録中...' : '登録'}
        </button>
      </form>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UserRegistration;
