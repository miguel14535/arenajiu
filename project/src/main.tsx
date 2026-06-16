import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedIfEmpty } from './lib/db';
import { initializeRemoteSync } from './lib/remoteSync';

async function bootstrap(): Promise<void> {
  await initializeRemoteSync();

  seedIfEmpty();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
