"use client"

import * as React from "react"
import { Flag, Mail, Lock, User, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import {
  UNIVERSITIES,
  FACULTIES,
  UNIVERSITIES_WITH_FACULTY,
} from "@/lib/mock-data"

export type AuthView = "login" | "register" | "forgot" | "reset"

export function AuthScreen({ onAuthed }: { onAuthed: () => void }) {
  const [view, setView] = React.useState<AuthView>("login")
  const toast = useToast()

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-destructive/15 blur-[100px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="glow-blue flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Flag className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-glow-blue">Flanki Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Your premium companion for team-based outdoor matches
          </p>
        </div>

        <div className="glass rounded-3xl p-6">
          {view === "login" && <LoginForm onAuthed={onAuthed} setView={setView} />}
          {view === "register" && <RegisterForm onAuthed={onAuthed} setView={setView} />}
          {view === "forgot" && (
            <ForgotForm
              setView={setView}
              onSent={() => {
                toast("Reset link sent to your email", "success")
                setView("reset")
              }}
            />
          )}
          {view === "reset" && (
            <ResetForm
              setView={setView}
              onDone={() => {
                toast("Password updated — please sign in", "success")
                setView("login")
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
      {children}
    </span>
  )
}

function LoginForm({ onAuthed, setView }: { onAuthed: () => void; setView: (v: AuthView) => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onAuthed()
      }}
    >
      <h2 className="mb-5 text-xl font-bold">Welcome back</h2>
      <div className="space-y-4">
        <div>
          <Label>Email</Label>
          <div className="relative">
            <FieldIcon><Mail className="h-4 w-4" /></FieldIcon>
            <Input type="email" required placeholder="you@student.edu.pl" className="pl-10" defaultValue="kamil@prz.edu.pl" />
          </div>
        </div>
        <div>
          <Label>Password</Label>
          <div className="relative">
            <FieldIcon><Lock className="h-4 w-4" /></FieldIcon>
            <Input type="password" required placeholder="••••••••" className="pl-10" defaultValue="password" />
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setView("forgot")}
        className="mt-3 text-xs font-medium text-primary hover:underline"
      >
        Forgot password?
      </button>
      <Button type="submit" size="lg" className="mt-5 w-full">Sign in</Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {"New to Flanki? "}
        <button type="button" onClick={() => setView("register")} className="font-semibold text-primary hover:underline">
          Create account
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ onAuthed, setView }: { onAuthed: () => void; setView: (v: AuthView) => void }) {
  const [university, setUniversity] = React.useState("")
  const showFaculty = UNIVERSITIES_WITH_FACULTY.includes(university)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onAuthed()
      }}
    >
      <h2 className="mb-5 text-xl font-bold">Create your account</h2>
      <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <div className="relative">
            <FieldIcon><User className="h-4 w-4" /></FieldIcon>
            <Input required placeholder="Your nickname" className="pl-10" />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <div className="relative">
            <FieldIcon><Mail className="h-4 w-4" /></FieldIcon>
            <Input type="email" required placeholder="you@student.edu.pl" className="pl-10" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Password</Label>
            <Input type="password" required placeholder="••••••••" />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" required placeholder="••••••••" />
          </div>
        </div>
        <div>
          <Label>University</Label>
          <Select value={university} onChange={(e) => setUniversity(e.target.value)} required>
            <option value="" disabled>Select university</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </Select>
        </div>
        {showFaculty && (
          <div className="animate-slide-up">
            <Label>Faculty</Label>
            <Select required defaultValue="">
              <option value="" disabled>Select faculty</option>
              {(FACULTIES[university] ?? []).map((f) => (
                <option key={f.value} value={f.value}>{f.value} — {f.label}</option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <Button type="submit" size="lg" className="mt-5 w-full">Create account</Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {"Already have an account? "}
        <button type="button" onClick={() => setView("login")} className="font-semibold text-primary hover:underline">
          Sign in
        </button>
      </p>
    </form>
  )
}

function ForgotForm({ setView, onSent }: { setView: (v: AuthView) => void; onSent: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSent()
      }}
    >
      <button type="button" onClick={() => setView("login")} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </button>
      <h2 className="mb-1 text-xl font-bold">Forgot password?</h2>
      <p className="mb-5 text-sm text-muted-foreground text-pretty">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <Label>Email</Label>
      <div className="relative">
        <FieldIcon><Mail className="h-4 w-4" /></FieldIcon>
        <Input type="email" required placeholder="you@student.edu.pl" className="pl-10" />
      </div>
      <Button type="submit" size="lg" className="mt-5 w-full">Send reset link</Button>
    </form>
  )
}

function ResetForm({ setView, onDone }: { setView: (v: AuthView) => void; onDone: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onDone()
      }}
    >
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs text-success ring-1 ring-success/30">
        <ShieldCheck className="h-4 w-4" /> Verified via email link
      </div>
      <h2 className="mb-5 text-xl font-bold">Set a new password</h2>
      <div className="space-y-4">
        <div>
          <Label>New password</Label>
          <div className="relative">
            <FieldIcon><Lock className="h-4 w-4" /></FieldIcon>
            <Input type="password" required placeholder="••••••••" className="pl-10" />
          </div>
        </div>
        <div>
          <Label>Confirm new password</Label>
          <div className="relative">
            <FieldIcon><Lock className="h-4 w-4" /></FieldIcon>
            <Input type="password" required placeholder="••••••••" className="pl-10" />
          </div>
        </div>
      </div>
      <Button type="submit" size="lg" className="mt-5 w-full">Update password</Button>
      <button type="button" onClick={() => setView("login")} className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground">
        Cancel
      </button>
    </form>
  )
}
