import { useState } from 'react';
import {
  getAdmins,
  createAdmin,
  deleteAdmin,
} from '../lib/auth';

export default function Admins() {
  const [, setRefresh] = useState(0);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const admins = getAdmins();

  function refresh() {
    setRefresh(v => v + 1);
  }

  function handleCreate() {
    if (!username || !password) {
      alert('Preencha usuário e senha');
      return;
    }

    try {
      createAdmin(username, password);

      setUsername('');
      setPassword('');

      refresh();

      alert('Administrador criado com sucesso');
    } catch (err: any) {
      alert(err.message);
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Deseja excluir este administrador?')) {
      return;
    }

    deleteAdmin(id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="dark-card p-6">
        <h1 className="text-2xl font-bold text-white mb-4">
          Administradores
        </h1>

        <div className="grid gap-4">
          <input
            className="dark-input"
            placeholder="Usuário"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            type="password"
            className="dark-input"
            placeholder="Senha"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg"
          >
            Criar Administrador
          </button>
        </div>
      </div>

      <div className="dark-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Administradores Cadastrados
        </h2>

        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between bg-dark-700 p-4 rounded-lg"
            >
              <div>
                <p className="text-white font-medium">
                  {admin.username}
                </p>

                <p className="text-xs text-gray-400">
                  {admin.role}
                </p>
              </div>

              <button
                onClick={() =>
                  handleDelete(admin.id)
                }
                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}