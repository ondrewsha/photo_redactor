import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { HistoryItem, ProjectItem } from '../types';
import { cn } from '../lib/cn';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/I18nContext';
import { HistoryCard } from './HistoryCard';
import { api } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  getStyleLabel: (id: string) => string;
  onDownload: (item: HistoryItem) => void;
  onDelete: (item: HistoryItem) => void;
  onOpen: (item: HistoryItem) => void;
  page: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  loading?: boolean;
  // Новые пропсы
  selectedProjectId: string;
  onChangeProject: (id: string) => void;
  onRefreshHistory: () => void;
  projects: ProjectItem[];
  onRefreshProjects: () => void;
}

export const HistoryModal: React.FC<Props> = ({
  isOpen, onClose, items, getStyleLabel, onDownload, onDelete, onOpen,
  page, total, limit, onPageChange, loading = false,
  selectedProjectId, onChangeProject, onRefreshHistory, onRefreshProjects, projects
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [moveModalItem, setMoveModalItem] = useState<HistoryItem | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      setIsCreating(true);
      await api.projects.create(newProjectName);
      setNewProjectName('');
      onRefreshProjects();
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await api.projects.delete(projectToDelete.id);
      if (selectedProjectId === projectToDelete.id) onChangeProject('all');
      onRefreshProjects();
      onRefreshHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleMove = async (projectId: string | null) => {
    if (!moveModalItem) return;
    try {
      await api.history.moveToProject(moveModalItem.job_id, projectId);
      setMoveModalItem(null);
      onRefreshHistory();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;

  const folderClass = (isActive: boolean) => cn(
    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all truncate flex justify-between items-center group",
    isActive 
      ? "bg-indigo-500 text-white shadow-md" 
      : theme === 'dark' ? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-600 hover:bg-zinc-100"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={cn("absolute inset-0 transition-colors", theme === 'dark' ? 'bg-black/80' : 'bg-white/70')} onClick={onClose} />
      
      <div className={cn(
        "relative w-full max-w-6xl h-[85vh] flex overflow-hidden rounded-[2.5rem] border shadow-2xl transition-colors",
        theme === 'dark' ? 'border-zinc-800 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900'
      )}>
        
        {/* ЛЕВАЯ ПАНЕЛЬ - САЙДБАР ПРОЕКТОВ */}
        <div className={cn(
          "w-64 flex flex-col border-r transition-colors hidden md:flex",
          theme === 'dark' ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-slate-50/50'
        )}>
          <div className="p-6 pb-2">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">{t.history.projectsTitle || "Проекты"}</h3>
            <div className="space-y-1">
              <button onClick={() => onChangeProject('all')} className={folderClass(selectedProjectId === 'all')}>
                {t.history.allGenerations || "Все картинки"}
              </button>
              <button onClick={() => onChangeProject('none')} className={folderClass(selectedProjectId === 'none')}>
                {t.history.unsorted || "Без проекта"}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1">
            {projects.map(p => (
              <button key={p.id} onClick={() => onChangeProject(p.id)} className={folderClass(selectedProjectId === p.id)}>
                <span className="truncate pr-2">{p.name}</span>
                <div 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setProjectToDelete({ id: p.id, name: p.name });
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500 hover:text-white rounded-md transition-all text-zinc-400"
                  title="Удалить проект"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 pt-2 border-t border-zinc-800/20">
            <form onSubmit={handleCreateProject} className="flex gap-2">
              <input 
                type="text" placeholder={t.history.newProject || "Новый проект..."}
                value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                className={cn("w-full text-xs rounded-xl px-3 py-2 border outline-none", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300')}
              />
              <Button type="submit" size="sm" isLoading={isCreating} className="rounded-xl px-3">+</Button>
            </form>
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ - КАРТИНКИ */}
        <div className="flex-1 flex flex-col relative">
          <div className={cn("flex items-center justify-between px-6 py-5 border-b", theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200')}>
            <h3 className="text-lg font-bold uppercase tracking-[0.45em]">{t.history.modalTitle}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 relative">
            {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-sm">Загрузка...</div>}
            
            {items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm font-bold uppercase tracking-widest text-zinc-500">Пусто</div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const ids = Array.isArray(item.style_ids) ? item.style_ids :[];
                  const styleLabels = ids.length ? ids.map(getStyleLabel) :[t.generator.defaultStyle];
                  return (
                    <HistoryCard
                      key={item.job_id} item={item} styleNames={styleLabels}
                      onDownload={onDownload} onDelete={onDelete} onOpen={onOpen}
                      onMove={() => setMoveModalItem(item)} // Передаем пропс перемещения
                    />
                  );
                })}
              </div>
            )}
          </div>
          
          <div className={cn("flex items-center justify-between px-6 py-4 border-t", theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200')}>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-zinc-500">
              <Button variant="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>{t.history.prev}</Button>
              <span>{page} / {totalPages}</span>
              <Button variant="ghost" size="sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>{t.history.next}</Button>
            </div>
            <Button onClick={onClose}>{t.history.modalClose}</Button>
          </div>
        </div>

      </div>

      {/* МИНИ-МОДАЛКА ДЛЯ ПЕРЕМЕЩЕНИЯ */}
      {moveModalItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={() => setMoveModalItem(null)}>
          <div className={cn("w-full max-w-sm rounded-2xl p-6 shadow-2xl", theme === 'dark' ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-zinc-900')} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">В какой проект переместить?</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button onClick={() => handleMove(null)} className="w-full text-left px-4 py-3 rounded-xl border hover:bg-indigo-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                Без проекта
              </button>
              {projects.map(p => (
                <button key={p.id} onClick={() => handleMove(p.id)} className="w-full text-left px-4 py-3 rounded-xl border hover:bg-indigo-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                  {p.name}
                </button>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" onClick={() => setMoveModalItem(null)}>Отмена</Button>
          </div>
        </div>
      )}

      {/* МОДАЛКА УДАЛЕНИЯ ПРОЕКТА */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setProjectToDelete(null)}>
          <div className={cn("w-full max-w-sm rounded-3xl p-6 shadow-2xl border", theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900')} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Удалить проект?</h3>
            <p className="text-sm mb-6 text-zinc-500 dark:text-zinc-400">
              Проект <b>«{projectToDelete.name}»</b> будет удалён навсегда. Все изображения, находящиеся в нём, не пропадут, а будут перемещены в папку «Без проекта».
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setProjectToDelete(null)}>Отмена</Button>
              {/* Убедитесь, что у вас в Button.tsx есть variant="danger" (он там есть по дефолту) */}
              <Button variant="danger" onClick={confirmDeleteProject}>Удалить</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
