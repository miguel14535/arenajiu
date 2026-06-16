import { useState } from 'react';
import { login } from '../lib/auth';

interface Props {
  onLogin: () => void;
}

export default function Login({
  onLogin
}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const success = login(
      username,
      password
    );

    if (!success) {
      alert('Login inválido');
      return;
    }

    onLogin();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-8 rounded-xl w-96"
      >
        <h1 className="text-white text-2xl mb-6">
          Login Arena Jiu Jitsu
        </h1>

        <input
          className="w-full p-3 mb-3 rounded bg-zinc-800 text-white"
          placeholder="Usuário"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />

        <input
          type="password"
          className="w-full p-3 mb-4 rounded bg-zinc-800 text-white"
          placeholder="Senha"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          className="w-full bg-red-600 text-white p-3 rounded"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}