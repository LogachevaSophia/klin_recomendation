import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Button, Card, TextInput, Alert } from '@gravity-ui/uikit';
import { authStore } from '../stores/authStore';
import { getApiErrorMessage } from '../api/apiError';
import styles from './AuthPage.module.scss';

export const LoginPage = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authStore.isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authStore.login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось войти'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.subtitle}>Войдите с учётной записью IAM</p>

        {error && (
          <Alert theme="danger" title="Ошибка" message={error} style={{ marginBottom: 16 }} />
        )}

        <form className={styles.form} onSubmit={onSubmit}>
          <TextInput
            type="email"
            label="Email"
            value={email}
            onUpdate={setEmail}
            autoComplete="email"
            required
          />
          <TextInput
            type="password"
            label="Пароль"
            value={password}
            onUpdate={setPassword}
            autoComplete="current-password"
            required
          />
          <div className={styles.actions}>
            <Button view="action" type="submit" loading={loading} width="max">
              Войти
            </Button>
          </div>
        </form>

        <p className={styles.footer}>
          Нет аккаунта?
          <Link className={styles.link} to="/register">
            Регистрация
          </Link>
        </p>
      </Card>
    </div>
  );
});
