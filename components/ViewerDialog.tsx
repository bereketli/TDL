'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { projectPhotoLabels, type Copy, type Language } from '@/lib/content';
import { Media } from './Media';
export type ModalState =
  | { kind: 'project'; title: string; photos: string[]; index: number }
  | { kind: 'inquiry'; text: string }
  | null;
export function ViewerDialog({ t, language, modal, onClose, onNavigate }: {
  t: Copy; language: Language; modal: ModalState; onClose: () => void; onNavigate: (direction: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const isOpen = modal !== null;
  const labels = projectPhotoLabels[language];
  const view = modal?.kind === 'project' ? {
    src: modal.photos[modal.index], title: modal.title, count: modal.photos.length,
    alt: `${modal.title}: ${labels.photo} ${modal.index + 1}`,
    caption: `${labels.photo} ${modal.index + 1} / ${modal.photos.length}`,
    previous: labels.previous, next: labels.next,
  } : null;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    const focused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; focused?.focus(); };
  }, [isOpen]);
  return <dialog ref={dialogRef} aria-labelledby="viewer-title" onCancel={onClose} onClick={event => { if (event.target === dialogRef.current) onClose(); }}
    onKeyDown={event => { if (!view || view.count < 2) return; if (event.key === 'ArrowLeft') { event.preventDefault(); onNavigate(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); onNavigate(1); } }}>
    <button className="modal-close icon" onClick={onClose} aria-label={t.close}><X /></button>
    {modal?.kind === 'inquiry' ? <div className="inquiry"><h2 id="viewer-title">{t.ready}</h2><textarea ref={textareaRef} readOnly value={modal.text} rows={8} aria-label={t.ready} />
      <button className="button" onClick={async () => { try { await navigator.clipboard.writeText(modal.text); setCopied(true); } catch { textareaRef.current?.focus(); textareaRef.current?.select(); } }}>{copied && <Check size={18} />}{copied ? t.copied : t.copy}</button>
    </div> : view ? <>
      <Media className="modal-image" src={view.src} alt={view.alt} sizes="90vw" />
      <div className="modal-caption"><div><h3 id="viewer-title">{view.title}</h3><p aria-live="polite">{view.caption}</p></div>
        {view.count > 1 && <div className="modal-arrows">
          <button className="circle" aria-label={view.previous} onClick={() => onNavigate(-1)}><ArrowLeft /></button>
          <button className="circle" aria-label={view.next} onClick={() => onNavigate(1)}><ArrowRight /></button>
        </div>}
      </div>
    </> : null}
  </dialog>;
}
