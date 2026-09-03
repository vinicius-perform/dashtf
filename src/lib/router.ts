import { useSyncExternalStore } from 'react';

/**
 * Micro-roteador baseado em History API — sem dependências.
 * Usado para expor rotas públicas de conteúdo (ex: /termos, /privacidade)
 * sem reload de página. O restante do app continua navegando por estado.
 */

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

const normalize = (path: string) => path.replace(/\/+$/, '') || '/';

/** Navega para um caminho e notifica os assinantes (sem recarregar a página). */
export function navigate(path: string) {
  if (normalize(window.location.pathname) === normalize(path)) return;
  window.history.pushState({}, '', path);
  emit();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener('popstate', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('popstate', callback);
  };
}

function getSnapshot() {
  return normalize(window.location.pathname);
}

/** Caminho atual normalizado (sem barra final), reativo a navigate() e ao botão voltar. */
export function usePathname(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => '/');
}
