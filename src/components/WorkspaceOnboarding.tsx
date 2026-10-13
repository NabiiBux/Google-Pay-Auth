import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  Server,
  Key,
  Shield,
  ExternalLink,
  Copy,
  RefreshCw,
  AlertCircle,
  MapPin,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { OnboardingSession, DomainSearchResult, ProvisioningStep } from '../types';

export const WorkspaceOnboarding: React.FC = () => {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Flow State
  const [domainMode, setDomainMode] = useState<'existing' | 'namecheap'>('namecheap');
  const [existingDomain, setExistingDomain] = useState('');
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [isSearchingDomain, setIsSearchingDomain] = useState(false);
  const [searchResult, setSearchResult] = useState<DomainSearchResult | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isNewDomain, setIsNewDomain] = useState(false);

  // Admin Account Details
  const [adminUsername, setAdminUsername] = useState('admin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Provisioning Execution State
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [provisionResult, setProvisionResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Provisioning Progress Steps
  const [steps, setSteps] = useState<ProvisioningStep[]>([
    { id: '1', label: 'Domain Verification & Namecheap DNS Records', status: 'idle' },
    { id: '2', label: 'Google Partner Sales Console Subscription Creation', status: 'idle' },
    { id: '3', label: 'Google Maps Platform APIs Auto-Activation', status: 'idle' },
    { id: '4', label: 'Admin Security Credentials & Tenant Handover', status: 'idle' },
  ]);

  // Fetch session on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get('token') || params.get('order_id') || 'gws_demo_session';
    setToken(sessionToken);

    fetch(`/api/portal/session/${sessionToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
          if (data.session.customerEmail) {
            setRecoveryEmail(data.session.customerEmail);
          }
          if (data.session.customerName) {
            const parts = data.session.customerName.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }
          if (data.session.domain) {
            setSelectedDomain(data.session.domain);
            if (data.session.status === 'completed') {
              setCurrentStep(3);
              setProvisionResult({
                adminEmail: data.session.adminUsername,
                tempPassword: data.session.adminPassword || 'Gnb!2026Secure#',
                mapsApiKey: data.session.mapsApiKey || 'AIzaSyDemoKey_GnbMentorMaps',
                domain: data.session.domain,
                enabledApis: ['Maps JavaScript API', 'Geocoding API', 'Places API'],
              });
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Session load note:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Search domain with Namecheap Reseller API
  const handleDomainSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainSearchQuery.trim()) return;

    setIsSearchingDomain(true);
    setSearchResult(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/portal/domains/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainSearchQuery.trim() }),
      });
      const data: DomainSearchResult = await res.json();
      setSearchResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to query Namecheap Reseller API');
    } finally {
      setIsSearchingDomain(false);
    }
  };

  // Select domain and advance to Step 2
  const handleSelectDomain = (domainToUse: string, isNewlyRegistered: boolean) => {
    setSelectedDomain(domainToUse);
    setIsNewDomain(isNewlyRegistered);
    setCurrentStep(2);
    setErrorMessage(null);
  };

  // Execute Automated Workspace + Maps Provisioning
  const handleStartProvisioning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;

    setIsProvisioning(true);
    setCurrentStep(3);
    setErrorMessage(null);

    // Simulate animated step progression
    const updateStepStatus = (id: string, status: 'running' | 'completed' | 'failed') => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    };

    try {
      // Step 1: DNS & Namecheap Registration
      updateStepStatus('1', 'running');
      if (isNewDomain) {
        await fetch('/api/portal/domains/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: selectedDomain,
            token,
            firstName,
            lastName,
            email: recoveryEmail,
            phone,
          }),
        });
      }
      await new Promise((r) => setTimeout(r, 900));
      updateStepStatus('1', 'completed');

      // Step 2: Google Workspace Partner Sales Console
      updateStepStatus('2', 'running');
      await new Promise((r) => setTimeout(r, 1100));
      updateStepStatus('2', 'completed');

      // Step 3: Google Maps Platform APIs
      updateStepStatus('3', 'running');
      await new Promise((r) => setTimeout(r, 1000));
      updateStepStatus('3', 'completed');

      // Step 4: Finalize Tenant
      updateStepStatus('4', 'running');
      const res = await fetch('/api/portal/workspace/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          domain: selectedDomain,
          adminUsername,
          isNewDomain,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Provisioning failed');

      updateStepStatus('4', 'completed');
      setProvisionResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Provisioning encountered an error. Please try again.');
      updateStepStatus('2', 'failed');
    } finally {
      setIsProvisioning(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-700" />
        <span className="text-sm font-semibold">Connecting to GNB Mentor Partner Portal...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Partner Badge Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 shadow-xs mb-1">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Google Workspace Authorized Partner Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
          Google Workspace & Domain Onboarding
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Order #{session?.orderId || '1084'} · SKU: {session?.sku || 'Business Starter'} · Managed by{' '}
          <strong className="text-slate-800">portal.gnbmentor.com</strong>
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm flex-1">
            <span className="font-bold">Setup Notice:</span> {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress Wizard Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 border border-slate-200/60 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => currentStep > 1 && setCurrentStep(1)}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            currentStep === 1
              ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">1</span>
          <span>Domain Setup</span>
        </button>

        <button
          type="button"
          onClick={() => selectedDomain && setCurrentStep(2)}
          disabled={!selectedDomain}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            currentStep === 2
              ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80'
              : selectedDomain
              ? 'text-slate-700 hover:text-slate-950'
              : 'text-slate-400 opacity-60 cursor-not-allowed'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">2</span>
          <span>Admin Account</span>
        </button>

        <button
          type="button"
          disabled={currentStep < 3}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            currentStep === 3
              ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80'
              : 'text-slate-400 opacity-60 cursor-not-allowed'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">3</span>
          <span>Activation</span>
        </button>
      </div>

      {/* STEP 1: Domain Selection (New via Namecheap vs Existing) */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Select Domain for Google Workspace
            </h2>
            <p className="text-xs text-slate-500">
              Every Workspace account requires a primary domain for email addresses and user logins.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setDomainMode('namecheap')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                domainMode === 'namecheap'
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                  Option 1 · Recommended
                </span>
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Register a New Domain</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Search & register instantly via our Namecheap Reseller API. DNS, MX, and SPF records are configured automatically.
              </p>
            </div>

            <div
              onClick={() => setDomainMode('existing')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                domainMode === 'existing'
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Option 2
                </span>
                <Server className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Use a Domain I Already Own</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your existing domain from Cloudflare, GoDaddy, or Namecheap. We provide simple DNS records to paste.
              </p>
            </div>
          </div>

          {/* Form: Namecheap Search */}
          {domainMode === 'namecheap' && (
            <div className="pt-2 space-y-4">
              <form onSubmit={handleDomainSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={domainSearchQuery}
                    onChange={(e) => setDomainSearchQuery(e.target.value)}
                    placeholder="Search domain (e.g. yourbusiness.com)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingDomain || !domainSearchQuery.trim()}
                  className="px-5 py-3 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {isSearchingDomain ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Check Namecheap</span>
                  )}
                </button>
              </form>

              {/* Namecheap API Search Result Card */}
              {searchResult && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {searchResult.domain}
                      </span>
                      {searchResult.available ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
                          Unavailable
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Wholesale registration: ${searchResult.price || '10.98'} / year · WHOIS Privacy Included
                    </span>
                  </div>

                  {searchResult.available && (
                    <button
                      type="button"
                      onClick={() => handleSelectDomain(searchResult.domain, true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>Select Domain</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form: Existing Domain */}
          {domainMode === 'existing' && (
            <div className="pt-2 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Your Existing Domain Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={existingDomain}
                    onChange={(e) => setExistingDomain(e.target.value)}
                    placeholder="mycompany.com"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => existingDomain.includes('.') && handleSelectDomain(existingDomain.trim(), false)}
                    disabled={!existingDomain.includes('.')}
                    className="px-5 py-3 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <span>Use Domain</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Configure Workspace Admin Account */}
      {currentStep === 2 && (
        <form onSubmit={handleStartProvisioning} className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Create Primary Administrator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Domain selected: <strong className="text-slate-800">{selectedDomain}</strong> ({isNewDomain ? 'New Namecheap Domain' : 'Existing Domain'})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Change Domain
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Morgan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Admin Email Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Primary Admin Username</label>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white">
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="admin"
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 bg-transparent focus:outline-none"
              />
              <span className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 bg-slate-100/80 border-l border-slate-200">
                @{selectedDomain}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              This will be your master login email for <code className="text-slate-600">admin.google.com</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Recovery Email</label>
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="yourpersonal@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Contact Phone (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Google Maps Platform APIs: <strong>Maps JavaScript, Geocoding, Places</strong></span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Auto-Enabled
            </span>
          </div>

          <button
            type="submit"
            disabled={isProvisioning}
            className="w-full py-4 px-6 bg-slate-950 hover:bg-black text-white font-bold text-sm rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isProvisioning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting to Google Partner Console...</span>
              </>
            ) : (
              <>
                <span>Provision Google Workspace & Maps Platform Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: Automated Provisioning Status & Handover */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.06)] p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center shadow-inner">
              {isProvisioning ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <CheckCircle2 className="w-9 h-9" />
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {isProvisioning ? 'Automating Google Partner Console Setup...' : 'Google Workspace Activated!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Tenant Domain: <strong className="text-slate-800">{selectedDomain}</strong>
            </p>
          </div>

          {/* Real-time Checklist Progression */}
          <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
            {steps.map((st) => (
              <div key={st.id} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{st.label}</span>
                {st.status === 'completed' && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </span>
                )}
                {st.status === 'running' && (
                  <span className="flex items-center gap-1 text-blue-600 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress
                  </span>
                )}
                {st.status === 'idle' && <span className="text-slate-400">Queued</span>}
                {st.status === 'failed' && <span className="text-rose-600 font-bold">Error</span>}
              </div>
            ))}
          </div>

          {/* Provisioning Credentials Handover Box */}
          {provisionResult && (
            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Master Admin Credentials
                  </span>
                  <a
                    href="https://admin.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <span>Open Admin Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Admin Username:</span>
                    <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-xl">
                      <code className="text-emerald-400 font-mono text-xs">{provisionResult.adminEmail}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(provisionResult.adminEmail, 'email')}
                        className="text-slate-400 hover:text-white cursor-pointer ml-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block">Temporary Password:</span>
                    <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-xl">
                      <code className="text-emerald-400 font-mono text-xs">{provisionResult.tempPassword}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(provisionResult.tempPassword, 'pw')}
                        className="text-slate-400 hover:text-white cursor-pointer ml-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Google Maps Platform API Key Box */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">Google Maps Platform Client Key:</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Domain-Restricted</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-xl">
                    <code className="text-yellow-400 font-mono text-xs truncate max-w-[280px]">
                      {provisionResult.mapsApiKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(provisionResult.mapsApiKey, 'maps')}
                      className="text-slate-400 hover:text-white cursor-pointer ml-2 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* DNS Instructions for Existing Domains */}
              {!isNewDomain && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>DNS Configuration Required (Since you used an existing domain):</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Add this MX record to your DNS provider (Cloudflare, GoDaddy, etc.) to start receiving emails:
                  </p>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 font-mono text-[11px] text-slate-800 flex justify-between items-center">
                    <span>MX &nbsp; @ &nbsp; 1 &nbsp; SMTP.GOOGLE.COM</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('1 SMTP.GOOGLE.COM', 'mx')}
                      className="text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Return to Store */}
              <div className="pt-2 flex justify-center">
                <a
                  href="https://gnbmentor.com/shop"
                  className="px-6 py-3 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  Return to GNB Mentor Store
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
