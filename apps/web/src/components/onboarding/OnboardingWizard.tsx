"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/dashboard/Icon";
import { cn } from "@/lib/cn";
import { C } from "@/styles/theme";
import { 
  useUpdateProfile, 
  useAddProject, 
  useSaveVoiceProfile,
  type ProjectLibraryItem,
} from "@/hooks/useAuth";

interface Step1Data {
  companyName: string;
}

interface Step2Data extends ProjectLibraryItem {}

interface Step3Data {
  sampleProposal: string;
}

type StepNumber = 1 | 2 | 3;

function Step1({ data, onChange, onNext }: {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
  onNext: () => void;
}) {
  const handleNext = () => {
    if (data.companyName.trim()) {
      onNext();
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accentDim">
          <Icon name="user" size={24} className="text-accent" />
        </div>
        <h2 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Welcome to ProposalAgent
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 400, margin: "0 auto" }}>
          Let&apos;s set up your account so we can generate personalized proposals that win more clients.
        </p>
      </div>

      <div className="mx-auto max-w-md">
        <label className="block text-left">
          <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Company or Business Name
          </span>
          <input
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            onKeyPress={(e) => e.key === "Enter" && handleNext()}
            className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-center text-[15px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
            placeholder="e.g. DanielForge Technologies"
            autoFocus
          />
        </label>

        <div className="mt-8">
          <Btn
            variant="primary"
            onClick={handleNext}
            disabled={!data.companyName.trim()}
            className="w-full"
          >
            Continue
            <Icon name="arrow" size={14} className="ml-2" />
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Step2({ data, onChange, onNext, onBack }: {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const handleNext = () => {
    if (data.title.trim() && data.client.trim() && data.outcome.trim() && data.budget.trim()) {
      onNext();
    }
  };

  const isValid = data.title.trim() && data.client.trim() && data.outcome.trim() && data.budget.trim();

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accentDim">
          <Icon name="star" size={24} className="text-accent" />
        </div>
        <h2 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Add Your First Project
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 500, margin: "0 auto" }}>
          Tell us about a successful past project. This helps the AI reference your experience in proposals.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-left">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Project Title
            </span>
            <input
              value={data.title}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
              placeholder="e.g. Government Healthcare App"
            />
          </label>

          <label className="block text-left">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Client Name
            </span>
            <input
              value={data.client}
              onChange={(e) => onChange({ ...data, client: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
              placeholder="e.g. KPK Government"
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-left">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Outcome / Achievement
            </span>
            <input
              value={data.outcome}
              onChange={(e) => onChange({ ...data, outcome: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
              placeholder="e.g. 100k+ government users"
            />
          </label>

          <label className="block text-left">
            <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Project Budget
            </span>
            <input
              value={data.budget}
              onChange={(e) => onChange({ ...data, budget: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
              placeholder="e.g. $75,000"
            />
          </label>
        </div>

        <label className="mt-4 block text-left">
          <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tech Stack (comma separated)
          </span>
          <input
            value={data.stack.join(", ")}
            onChange={(e) => onChange({ 
              ...data, 
              stack: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
            })}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none ring-accent/40 placeholder:text-textDim focus:border-accent focus:ring-2"
            placeholder="e.g. React Native, Node.js, MongoDB, AWS"
          />
        </label>

        <div className="mt-8 flex gap-3">
          <Btn
            variant="ghost"
            onClick={onBack}
            className="flex-1"
          >
            <Icon name="arrow" size={14} className="mr-2 rotate-180" />
            Back
          </Btn>
          <Btn
            variant="primary"
            onClick={handleNext}
            disabled={!isValid}
            className="flex-1"
          >
            Continue
            <Icon name="arrow" size={14} className="ml-2" />
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Step3({ data, onChange, onComplete, onBack, isLoading }: {
  data: Step3Data;
  onChange: (data: Step3Data) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const handleComplete = () => {
    if (data.sampleProposal.trim()) {
      onComplete();
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accentDim">
          <Icon name="sparkle" size={24} className="text-accent" />
        </div>
        <h2 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Train Your Voice
        </h2>
        <p style={{ fontSize: 14, color: C.textMuted, maxWidth: 500, margin: "0 auto" }}>
          Paste one of your best proposals so the AI learns your writing style and tone.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <label className="block text-left">
          <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sample Proposal
          </span>
          <textarea
            rows={12}
            value={data.sampleProposal}
            onChange={(e) => onChange({ sampleProposal: e.target.value })}
            className="w-full resize-y rounded-lg border border-border bg-bg px-4 py-3 text-[13px] text-text outline-none placeholder:text-textDim focus:border-accent focus:ring-2 focus:ring-accent/40"
            placeholder="Paste a complete proposal that won you a client. Include your opening, approach, pricing, and closing..."
          />
        </label>

        <div className="mt-8 flex gap-3">
          <Btn
            variant="ghost"
            onClick={onBack}
            className="flex-1"
            disabled={isLoading}
          >
            <Icon name="arrow" size={14} className="mr-2 rotate-180" />
            Back
          </Btn>
          <Btn
            variant="primary"
            onClick={handleComplete}
            disabled={!data.sampleProposal.trim() || isLoading}
            className="flex-1"
            leftIcon={isLoading ? undefined : <Icon name="check" size={14} />}
          >
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [isCompleting, setIsCompleting] = useState(false);

  const updateProfile = useUpdateProfile();
  const addProject = useAddProject();
  const saveVoice = useSaveVoiceProfile();

  const [step1Data, setStep1Data] = useState<Step1Data>({ companyName: "" });
  const [step2Data, setStep2Data] = useState<Step2Data>({
    title: "",
    client: "",
    outcome: "",
    stack: [],
    budget: "",
  });
  const [step3Data, setStep3Data] = useState<Step3Data>({ sampleProposal: "" });

  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setCurrentStep(3);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // Update company name
      await updateProfile.mutateAsync({ companyName: step1Data.companyName });
      
      // Add project
      await addProject.mutateAsync(step2Data);
      
      // Save voice profile
      await saveVoice.mutateAsync({ samples: step3Data.sampleProposal });
      
      // Redirect to dashboard
      router.push("/dashboard/jobs");
    } catch (error) {
      console.error("Onboarding failed:", error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Progress indicator */}
        <div className="mb-12 flex justify-center">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                    step <= currentStep
                      ? "bg-accent text-white"
                      : "bg-border text-textDim"
                  )}
                >
                  {step < currentStep ? (
                    <Icon name="check" size={14} />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      "ml-4 h-0.5 w-12",
                      step < currentStep ? "bg-accent" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-surface p-8 md:p-12">
          {currentStep === 1 && (
            <Step1
              data={step1Data}
              onChange={setStep1Data}
              onNext={handleStep1Next}
            />
          )}
          
          {currentStep === 2 && (
            <Step2
              data={step2Data}
              onChange={setStep2Data}
              onNext={handleStep2Next}
              onBack={handleStep2Back}
            />
          )}
          
          {currentStep === 3 && (
            <Step3
              data={step3Data}
              onChange={setStep3Data}
              onComplete={handleComplete}
              onBack={handleStep3Back}
              isLoading={isCompleting}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p style={{ fontSize: 12, color: C.textDim }}>
            Step {currentStep} of 3 • This takes about 3 minutes
          </p>
        </div>
      </div>
    </div>
  );
}