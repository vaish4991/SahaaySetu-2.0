import React, { useState, useEffect, lazy, Suspense } from 'react';
import { IncidentRecord, DEMO_SCENARIOS, IncidentInputPayload } from '@sahaaysetu/shared';
import { Navbar } from './components/Navbar';
import { ResponderBriefModal } from './components/ResponderBriefModal';
import { fetchHealth, fetchIncidents, fetchIncidentById, resetDemoScenariosApi, HealthStatus } from './services/api';
import { Language } from './locales/translations';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';

// Dynamic lazy imports for efficient bundle splitting and fast initial page load
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SubmitIncident = lazy(() => import('./pages/SubmitIncident').then(m => ({ default: m.SubmitIncident })));
const AnalysisReview = lazy(() => import('./pages/AnalysisReview').then(m => ({ default: m.AnalysisReview })));
const ActionCenter = lazy(() => import('./pages/ActionCenter').then(m => ({ default: m.ActionCenter })));
const IncidentExplorer = lazy(() => import('./pages/IncidentExplorer').then(m => ({ default: m.IncidentExplorer })));
const SettingsPrivacy = lazy(() => import('./pages/SettingsPrivacy').then(m => ({ default: m.SettingsPrivacy })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));

type TabType = 'dashboard' | 'submit' | 'review' | 'actions' | 'explorer' | 'settings' | 'auth';

/** Accessible fallback loader during dynamic chunk resolution */
const PageLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center" role="status" aria-live="polite">
    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-slate-600 font-medium text-sm">Loading crisis intelligence interface...</p>
    <span className="sr-only">Loading page content</span>
  </div>
);

/** Full-screen spinner while Firebase resolves stored session */
const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#020617' }}>
    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-slate-400 text-sm font-medium">Verifying session…</p>
  </div>
);

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeIncident, setActiveIncident] = useState<IncidentRecord | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [briefIncidentId, setBriefIncidentId] = useState<string | null>(null);
  const [submissionInitialData, setSubmissionInitialData] = useState<Partial<IncidentInputPayload> | undefined>(undefined);

  const refreshData = async () => {
    try {
      const healthData = await fetchHealth();
      setHealth(healthData);
    } catch (e) {
      console.warn('Backend health check pending:', e);
    }
    try {
      const list = await fetchIncidents();
      setIncidents(list);
      if (list.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(list[0].id);
        setActiveIncident(list[0]);
      }
    } catch (e) {
      console.warn('Backend incidents fetch pending:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedIncidentId) return;
    const found = incidents.find(i => i.id === selectedIncidentId);
    if (found) {
      setActiveIncident(found);
    } else {
      fetchIncidentById(selectedIncidentId)
        .then(inc => setActiveIncident(inc))
        .catch(err => console.error(err));
    }
  }, [selectedIncidentId, incidents]);

  const handleSelectIncident = (id: string, view: 'review' | 'actions') => {
    setSelectedIncidentId(id);
    setCurrentTab(view);
  };

  const handleAnalysisSuccess = async (newIncidentId: string) => {
    await refreshData();
    setSelectedIncidentId(newIncidentId);
    setCurrentTab('review');
  };

  const handleSelectDemoScenario = (demoId: string) => {
    const demo = DEMO_SCENARIOS.find(d => d.id === demoId);
    if (demo) {
      setSubmissionInitialData(demo.inputPayload as any);
      setCurrentTab('submit');
    }
  };

  const handleOpenBrief = (id?: string) => {
    const target = id || selectedIncidentId;
    if (target) {
      setBriefIncidentId(target);
      setBriefModalOpen(true);
    }
  };

  const handleResetDemos = async () => {
    try {
      await resetDemoScenariosApi();
      await refreshData();
    } catch (err) {
      console.error('Failed to reset demos:', err);
    }
  };

  /* ── Auth gate ───────────────────────────────────────────── */
  if (authLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <LoginPage />;

  /* ── Authenticated app ───────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-md focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white font-semibold text-sm transition"
      >
        Skip to main content
      </a>

      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'submit') setSubmissionInitialData(undefined);
          if ((tab === 'review' || tab === 'actions') && !activeIncident && incidents.length > 0) {
            setSelectedIncidentId(incidents[0].id);
            setActiveIncident(incidents[0]);
          }
          setCurrentTab(tab);
        }}
        geminiConfigured={Boolean(health?.geminiConfigured)}
        hasActiveIncident={Boolean(activeIncident || incidents.length > 0)}
        language={language}
        onLanguageChange={setLanguage}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 pb-16 focus:outline-none">
        <Suspense fallback={<PageLoadingFallback />}>
          {currentTab === 'dashboard' && (
            <Dashboard
              incidents={incidents}
              onAnalyzeNew={() => { setSubmissionInitialData(undefined); setCurrentTab('submit'); }}
              onSelectIncident={handleSelectIncident}
              onSelectDemoScenario={handleSelectDemoScenario}
              onResetDemos={handleResetDemos}
              language={language}
            />
          )}
          {currentTab === 'submit' && (
            <SubmitIncident
              onAnalysisSuccess={handleAnalysisSuccess}
              language={language}
              initialPayload={submissionInitialData}
            />
          )}
          {currentTab === 'review' && (activeIncident || incidents[0]) && (
            <AnalysisReview
              incident={activeIncident || incidents[0]}
              onUpdateIncident={(updated) => {
                setActiveIncident(updated);
                setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
              }}
              onProceedToActions={() => setCurrentTab('actions')}
              onOpenBrief={() => handleOpenBrief((activeIncident || incidents[0]).id)}
              onSelectDuplicate={(dupId) => handleSelectIncident(dupId, 'review')}
              language={language}
            />
          )}
          {currentTab === 'actions' && (activeIncident || incidents[0]) && (
            <ActionCenter
              incident={activeIncident || incidents[0]}
              onUpdateIncident={(updated) => {
                setActiveIncident(updated);
                setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
              }}
              onBackToReview={() => setCurrentTab('review')}
              onOpenBrief={() => handleOpenBrief((activeIncident || incidents[0]).id)}
              language={language}
            />
          )}
          {currentTab === 'explorer' && (
            <IncidentExplorer
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
              onOpenBrief={(id) => handleOpenBrief(id)}
              language={language}
            />
          )}
          {currentTab === 'settings' && (
            <SettingsPrivacy
              language={language}
              onLanguageChange={setLanguage}
              geminiConfigured={Boolean(health?.geminiConfigured)}
              onDataCleared={() => refreshData()}
            />
          )}
          {currentTab === 'auth' && (
            <AuthPage
              language={language}
              onAuthSuccess={() => setCurrentTab('dashboard')}
            />
          )}
        </Suspense>
      </main>

      {briefIncidentId && (
        <ResponderBriefModal
          incidentId={briefIncidentId}
          isOpen={briefModalOpen}
          onClose={() => setBriefModalOpen(false)}
        />
      )}

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-300">SahaaySetu (सहायसेतु) — The AI Crisis-to-Action Bridge</p>
          <p className="max-w-2xl mx-auto text-slate-500">
            Engineered for PromptWars Societal Benefit Challenge. Compliant with WCAG 2.2 AA accessibility principles, explicit medical consent safeguards, and explainable evidence-to-action triage.
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);
