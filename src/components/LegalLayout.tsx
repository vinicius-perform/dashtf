import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

export type LegalPage = 'termos' | 'privacidade';

export interface LegalBlock {
  type: 'p' | 'ul';
  text?: string;
  items?: string[];
}

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export const LEGAL_LAST_UPDATED = '3 de setembro de 2026';

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
  onBack: () => void;
  crossLinkLabel: string;
  onCrossLink: () => void;
}

/** Casca visual compartilhada pelas páginas de Termos e de Privacidade. */
export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  updatedAt,
  intro,
  sections,
  onBack,
  crossLinkLabel,
  onCrossLink
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [title]);

  return (
    <div className="min-h-screen bg-brand-bg text-zinc-300 selection:bg-brand-neon selection:text-black">
      {/* Barra superior */}
      <div className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <Logo />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs text-zinc-500 mt-1">Última atualização: {updatedAt}</p>

        <p className="text-sm leading-relaxed mt-6">{intro}</p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.blocks.map((block, i) =>
                  block.type === 'p' ? (
                    <p key={i} className="text-sm leading-relaxed">
                      {block.text}
                    </p>
                  ) : (
                    <ul key={i} className="space-y-1.5 pl-1">
                      {block.items?.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed flex gap-2.5">
                          <span className="text-brand-neon mt-1.5 w-1 h-1 rounded-full bg-brand-neon shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Rodapé de navegação entre documentos */}
        <div className="mt-12 pt-6 border-t border-brand-border flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onCrossLink}
            className="text-xs font-semibold text-brand-neon hover:underline"
          >
            Ler também: {crossLinkLabel}
          </button>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
