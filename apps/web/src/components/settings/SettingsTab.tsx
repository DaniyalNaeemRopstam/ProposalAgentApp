"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/dashboard/Icon";
import { cn } from "@/lib/cn";
import { C } from "@/styles/theme";
import { 
  useMe, 
  useUpdateProfile, 
  useSaveVoiceProfile, 
  useAddProject, 
  useRemoveProject,
  type ProfileUpdateData,
  type ProjectLibraryItem,
} from "@/hooks/useAuth";
import { 
  useBillingStatus, 
  useCreateCheckout, 
  useCreatePortal, 
  PLAN_CONFIGS,
  type BillingPlan,
} from "@/hooks/useBilling";

type TabId = "profile" | "voice" | "projects" | "billing";

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "profile", label: "Profile", icon: "user" },
  { id: "voice", label: "Voice Profile", icon: "sparkle" },
  { id: "projects", label: "Project Library", icon: "star" },
  { id: "billing", label: "Billing", icon: "trending" },
];

function ProfileTab() {
  const { data: user, isLoading, error } = useMe();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<ProfileUpdateData>({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (field: keyof ProfileUpdateData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!hasChanges) return;
    updateProfile.mutate(form, {
      onSuccess: () => {
        setForm({});
        setHasChanges(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-border" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-border" />
            <div className="h-10 animate-pulse rounded-lg bg-border" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-lg border border-danger/30 bg-dangerDim/30 p-4 text-center text-danger">
        Failed to load profile data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>
          Account Information
        </h3>
        <div className="space-y-4">
          <label className="block">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Full Name
            </span>
            <input
              value={form.name ?? user.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
              placeholder="Your full name"
            />
          </label>

          <label className="block">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email Address
            </span>
            <input
              type="email"
              value={form.email ?? user.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
              placeholder="your@email.com"
            />
          </label>

          <label className="block">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Company Name
            </span>
            <input
              value={form.companyName ?? user.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
              placeholder="Your company or freelance business name"
            />
          </label>
        </div>

        {updateProfile.error && (
          <div className="mt-4 rounded-lg border border-danger/30 bg-dangerDim/30 px-3 py-2 text-[12px] text-danger">
            {updateProfile.error.message}
          </div>
        )}

        <div className="mt-6">
          <Btn
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || updateProfile.isPending}
            className="text-xs"
          >
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function VoiceTab() {
  const { data: user } = useMe();
  const saveVoice = useSaveVoiceProfile();
  const [samples, setSamples] = useState(() => {
    const existing = user?.voiceProfile || "";
    const split = existing.split("\n---\n");
    return {
      sample1: split[0] || "",
      sample2: split[1] || "",
      sample3: split[2] || "",
    };
  });

  const handleSave = () => {
    const combined = [samples.sample1, samples.sample2, samples.sample3]
      .filter(s => s.trim())
      .join("\n---\n");
    
    saveVoice.mutate({ samples: combined });
  };

  const hasContent = Object.values(samples).some(s => s.trim());

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>
          Voice Profile Training
        </h3>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
          Paste 3 of your best proposals to train the AI to write in your voice and style.
        </p>

        <div className="space-y-4">
          {[1, 2, 3].map((num) => (
            <div key={num}>
              <label className="block">
                <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Sample Proposal {num}
                </span>
                <textarea
                  rows={6}
                  value={samples[`sample${num}` as keyof typeof samples]}
                  onChange={(e) => setSamples(prev => ({ ...prev, [`sample${num}`]: e.target.value }))}
                  className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                  placeholder={`Paste your ${num === 1 ? "first" : num === 2 ? "second" : "third"} sample proposal here...`}
                />
              </label>
            </div>
          ))}
        </div>

        {saveVoice.error && (
          <div className="mt-4 rounded-lg border border-danger/30 bg-dangerDim/30 px-3 py-2 text-[12px] text-danger">
            {saveVoice.error.message}
          </div>
        )}

        <div className="mt-6">
          <Btn
            variant="primary"
            onClick={handleSave}
            disabled={!hasContent || saveVoice.isPending}
            className="text-xs"
            leftIcon={<Icon name="sparkle" size={12} />}
          >
            {saveVoice.isPending ? "Saving..." : "Save Voice Profile"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function ProjectsTab() {
  const { data: user } = useMe();
  const addProject = useAddProject();
  const removeProject = useRemoveProject();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProjectLibraryItem>({
    title: "",
    client: "",
    outcome: "",
    stack: [],
    budget: "",
  });

  const handleAddProject = () => {
    addProject.mutate(form, {
      onSuccess: () => {
        setForm({ title: "", client: "", outcome: "", stack: [], budget: "" });
        setShowForm(false);
      },
    });
  };

  const handleRemoveProject = (projectId: string) => {
    removeProject.mutate(projectId);
  };

  const projects = user?.projectLibrary || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 600, color: C.text }}>
          Project Library
        </h3>
        <Btn
          variant="primary"
          onClick={() => setShowForm(!showForm)}
          className="text-xs"
          leftIcon={<Icon name="star" size={12} />}
        >
          Add Project
        </Btn>
      </div>

      {showForm && (
        <div className="rounded-xl border border-accent bg-surface p-4">
          <h4 style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>
            Add New Project
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Project Title
              </span>
              <input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. SaaS MVP Development"
              />
            </label>
            <label className="block">
              <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Client
              </span>
              <input
                value={form.client}
                onChange={(e) => setForm(prev => ({ ...prev, client: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. TechCorp Inc"
              />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Outcome
              </span>
              <input
                value={form.outcome}
                onChange={(e) => setForm(prev => ({ ...prev, outcome: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. 100k+ government users"
              />
            </label>
            <label className="block">
              <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Budget
              </span>
              <input
                value={form.budget}
                onChange={(e) => setForm(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
                placeholder="e.g. $50,000"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tech Stack (comma separated)
            </span>
            <input
              value={form.stack.join(", ")}
              onChange={(e) => setForm(prev => ({ ...prev, stack: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
              placeholder="e.g. React Native, Node.js, MongoDB"
            />
          </label>

          {addProject.error && (
            <div className="mt-4 rounded-lg border border-danger/30 bg-dangerDim/30 px-3 py-2 text-[12px] text-danger">
              {addProject.error.message}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Btn
              variant="primary"
              onClick={handleAddProject}
              disabled={!form.title.trim() || !form.client.trim() || addProject.isPending}
              className="text-xs"
            >
              {addProject.isPending ? "Adding..." : "Add Project"}
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="text-xs"
            >
              Cancel
            </Btn>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <div className="mb-3 text-2xl">📁</div>
            <p className="text-sm text-textMuted">No projects added yet</p>
            <p className="text-xs text-textDim">Add past projects to improve AI proposal generation</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 style={{ fontFamily: "Syne", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                    {project.title}
                  </h4>
                  <div className="mb-2 flex flex-wrap gap-4 text-xs text-textMuted">
                    <span>Client: {project.client}</span>
                    <span>Budget: {project.budget}</span>
                  </div>
                  <p className="mb-3 text-[13px] text-textMuted">{project.outcome}</p>
                  <div className="flex flex-wrap gap-1">
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-accentDim px-2 py-0.5 text-[10px] font-medium text-accentText"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <Btn
                  variant="ghost"
                  onClick={() => handleRemoveProject(project._id)}
                  disabled={removeProject.isPending}
                  className="ml-2 text-xs text-danger hover:bg-dangerDim/30"
                >
                  Remove
                </Btn>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BillingTab() {
  const { data: status, isLoading } = useBillingStatus();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreatePortal();

  const handleUpgrade = (plan: Exclude<BillingPlan, "free">) => {
    createCheckout.mutate(plan, {
      onSuccess: (checkoutUrl) => {
        window.location.href = checkoutUrl;
      },
    });
  };

  const handleManageBilling = () => {
    createPortal.mutate(undefined, {
      onSuccess: (portalUrl) => {
        window.location.href = portalUrl;
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-border" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-border" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = status?.plan || "free";
  const currentConfig = PLAN_CONFIGS[currentPlan];

  return (
    <div className="space-y-6">
      <div>
        <h3 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>
          Current Plan
        </h3>
        
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700, color: C.text }}>
                {currentConfig.name}
              </h4>
              <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 8 }}>
                {currentConfig.price === 0 ? "Free" : `$${currentConfig.price}/month`}
              </p>
              {status && (
                <div className="text-xs text-textMuted">
                  {currentConfig.proposalsPerMonth ? (
                    <>
                      {status.proposalsUsedThisMonth} / {currentConfig.proposalsPerMonth} proposals used this month
                    </>
                  ) : (
                    "Unlimited proposals"
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {currentPlan !== "free" && (
                <Btn
                  variant="ghost"
                  onClick={handleManageBilling}
                  disabled={createPortal.isPending}
                  className="text-xs"
                >
                  {createPortal.isPending ? "Loading..." : "Manage Billing"}
                </Btn>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16 }}>
          Available Plans
        </h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(["solo", "pro", "enterprise"] as const).map((plan) => {
            const config = PLAN_CONFIGS[plan];
            const isCurrent = currentPlan === plan;
            
            return (
              <div
                key={plan}
                className={cn(
                  "rounded-xl border p-6",
                  isCurrent 
                    ? "border-accent bg-accentDim/20" 
                    : "border-border bg-surface hover:border-borderBright"
                )}
              >
                <div className="mb-4">
                  <h4 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 700, color: C.text }}>
                    {config.name}
                  </h4>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.accent, marginBottom: 4 }}>
                    ${config.price}<span style={{ fontSize: 14, fontWeight: 400, color: C.textMuted }}>/mo</span>
                  </div>
                </div>
                
                <ul className="mb-6 space-y-2">
                  {config.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-textMuted">
                      <Icon name="check" size={12} className="mt-0.5 shrink-0 text-success" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {isCurrent ? (
                  <Btn variant="ghost" disabled className="w-full text-xs">
                    Current Plan
                  </Btn>
                ) : (
                  <Btn
                    variant="primary"
                    onClick={() => handleUpgrade(plan)}
                    disabled={createCheckout.isPending}
                    className="w-full text-xs"
                  >
                    {createCheckout.isPending ? "Loading..." : "Upgrade"}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SettingsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "profile") as TabId;

  const handleTabChange = (tabId: TabId) => {
    router.push(`/dashboard/settings?tab=${tabId}`);
  };

  return (
    <div className="animate-slideUp">
      <div className="mb-6">
        <h1 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: C.textMuted }}>
          Manage your account, voice profile, projects, and billing
        </p>
        <Link
          href="/dashboard/settings/integrations"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-borderBright hover:bg-surfaceHover"
        >
          <span>
            <span className="block text-[13px] font-semibold text-text">Job feeds & integrations</span>
            <span className="text-[12px] text-textMuted">Sync Upwork, LinkedIn, Wellfound & Hacker News</span>
          </span>
          <span className="text-accentText text-sm font-medium">Open →</span>
        </Link>
      </div>

      <div className="flex gap-4 border-b border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-textMuted hover:text-text"
            )}
          >
            <Icon name={tab.icon as any} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "voice" && <VoiceTab />}
        {activeTab === "projects" && <ProjectsTab />}
        {activeTab === "billing" && <BillingTab />}
      </div>
    </div>
  );
}