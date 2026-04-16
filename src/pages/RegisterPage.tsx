import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Button, Card, TextInput, Alert } from '@gravity-ui/uikit';
import { authStore } from '../stores/authStore';
import { getApiErrorMessage } from '../api/apiError';
import styles from './AuthPage.module.scss';

export const RegisterPage = observer(() => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authStore.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authStore.register(
        email.trim(),
        password,
        firstName.trim() || undefined,
        lastName.trim() || undefined,
      );
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Не удалось зарегистрироваться'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте учётную запись</p>

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
            autoComplete="new-password"
            required
          />
          <TextInput
            label="Имя"
            value={firstName}
            onUpdate={setFirstName}
            autoComplete="given-name"
          />
          <TextInput
            label="Фамилия"
            value={lastName}
            onUpdate={setLastName}
            autoComplete="family-name"
          />
          <div className={styles.actions}>
            <Button view="action" type="submit" loading={loading} width="max">
              Зарегистрироваться
            </Button>
          </div>
        </form>

        <p className={styles.footer}>
          Уже есть аккаунт?
          <Link className={styles.link} to="/login">
            Войти
          </Link>
        </p>
      </Card>
    </div>
  );
});
