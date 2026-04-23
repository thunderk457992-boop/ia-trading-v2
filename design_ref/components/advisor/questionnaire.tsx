"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  ArrowRight, 
  ArrowLeft, 
  Target, 
  Clock, 
  TrendingUp, 
  Shield,
  Wallet,
  Brain
} from "lucide-react"

interface Question {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  options: {
    value: string
    label: string
    description: string
  }[]
}

const questions: Question[] = [
  {
    id: "goal",
    title: "What is your primary investment goal?",
    subtitle: "This helps us tailor recommendations to your objectives",
    icon: Target,
    options: [
      { value: "growth", label: "Aggressive Growth", description: "Maximize returns with higher risk tolerance" },
      { value: "balanced", label: "Balanced Growth", description: "Balance between growth and stability" },
      { value: "income", label: "Passive Income", description: "Focus on yield-generating assets" },
      { value: "preservation", label: "Capital Preservation", description: "Protect capital with minimal risk" },
    ],
  },
  {
    id: "timeline",
    title: "What is your investment timeline?",
    subtitle: "Longer timelines can accommodate more volatility",
    icon: Clock,
    options: [
      { value: "short", label: "Short Term", description: "Less than 1 year" },
      { value: "medium", label: "Medium Term", description: "1-3 years" },
      { value: "long", label: "Long Term", description: "3-5 years" },
      { value: "extended", label: "Extended", description: "5+ years" },
    ],
  },
  {
    id: "experience",
    title: "How experienced are you with crypto?",
    subtitle: "We adjust complexity based on your knowledge level",
    icon: Brain,
    options: [
      { value: "beginner", label: "Beginner", description: "New to cryptocurrency investing" },
      { value: "intermediate", label: "Intermediate", description: "Some experience with crypto" },
      { value: "advanced", label: "Advanced", description: "Experienced trader/investor" },
      { value: "expert", label: "Expert", description: "Professional-level knowledge" },
    ],
  },
  {
    id: "risk",
    title: "How do you handle market downturns?",
    subtitle: "Understanding your risk tolerance is crucial",
    icon: TrendingUp,
    options: [
      { value: "sell", label: "Sell to Protect", description: "I prefer to exit positions quickly" },
      { value: "hold", label: "Hold & Wait", description: "I wait for recovery" },
      { value: "buy", label: "Buy the Dip", description: "I see opportunity in downturns" },
      { value: "rebalance", label: "Strategic Rebalance", description: "I adjust positions strategically" },
    ],
  },
  {
    id: "allocation",
    title: "How much of your portfolio is in crypto?",
    subtitle: "This helps us understand your overall exposure",
    icon: Wallet,
    options: [
      { value: "small", label: "Less than 10%", description: "Crypto is a small allocation" },
      { value: "moderate", label: "10-25%", description: "Moderate crypto exposure" },
      { value: "significant", label: "25-50%", description: "Significant crypto allocation" },
      { value: "majority", label: "50%+", description: "Crypto-heavy portfolio" },
    ],
  },
  {
    id: "security",
    title: "What is your security priority?",
    subtitle: "We factor security preferences into recommendations",
    icon: Shield,
    options: [
      { value: "convenience", label: "Convenience First", description: "Easy access is most important" },
      { value: "balanced", label: "Balanced Approach", description: "Mix of security and convenience" },
      { value: "secure", label: "Security Focused", description: "Prioritize asset protection" },
      { value: "maximum", label: "Maximum Security", description: "Cold storage and multi-sig" },
    ],
  },
]

interface QuestionnaireProps {
  onComplete: () => void
}

export function AdvisorQuestionnaire({ onComplete }: QuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setIsAnalyzing(true)
      setTimeout(() => {
        setIsAnalyzing(false)
        onComplete()
      }, 2000)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const selectedValue = answers[currentQuestion.id]
  const Icon = currentQuestion.icon

  if (isAnalyzing) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="relative mb-5">
          <div className="h-16 w-16 rounded-full border-2 border-border" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-transparent border-t-foreground" />
          <Brain className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-foreground" />
        </div>
        <h3 className="text-[17px] font-semibold text-foreground">Analyzing Your Profile</h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground">Generating personalized recommendations...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Icon className="h-4.5 w-4.5 text-foreground" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-foreground">{currentQuestion.title}</h2>
            <p className="text-[12px] text-muted-foreground">{currentQuestion.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "relative rounded-lg border p-4 text-left transition-all duration-150",
                selectedValue === option.value
                  ? "border-foreground bg-secondary/50"
                  : "border-border hover:border-border/80 hover:bg-secondary/30"
              )}
            >
              <div className={cn(
                "absolute right-3 top-3 h-4 w-4 rounded-full border-2 transition-colors",
                selectedValue === option.value
                  ? "border-foreground bg-foreground"
                  : "border-muted-foreground/40"
              )}>
                {selectedValue === option.value && (
                  <div className="absolute inset-0.5 rounded-full bg-background" />
                )}
              </div>
              <h3 className="pr-6 text-[13px] font-medium text-foreground">{option.label}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{option.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors",
              currentStep === 0
                ? "text-muted-foreground/50 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedValue}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium transition-all",
              selectedValue
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            {currentStep === questions.length - 1 ? "Get Analysis" : "Next"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
