import * as React from 'react'
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Target,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { UNIVERSITIES, FACULTIES } from '@/lib/constants'
import { toast } from '@/components/ui/toast-store'
import type { UniversityChoice } from '@/lib/types'

type AuthView = 'login' | 'register' | 'forgot' | 'reset'

interface AuthScreenProps {
  onAuthenticated: () => void
}

function Field({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <div className="[&_input]:pl-11">{children}</div>
    </div>
  )
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [view, setView] = React.useState<AuthView>('login')
  const [university, setUniversity] = React.useState<UniversityChoice | null>(
    null,
  )
  const [faculty, setFaculty] = React.useState<string | null>(null)

  const selectedUni = UNIVERSITIES.find((u) => u.value === university)
  const showFaculty = selectedUni?.hasFaculties

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (view === 'login') {
      onAuthenticated()
    } else if (view === 'register') {
      toast('Konto utworzone! Sprawdź e-mail, aby je aktywować.', 'success')
      setView('login')
    } else if (view === 'forgot') {
      toast('Jeśli e-mail istnieje w bazie, wysłano link resetu.', 'info')
      setView('login')
    } else {
      toast('Hasło zostało zmienione. Możesz się zalogować.', 'success')
      setView('login')
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teamA/15 shadow-glow-blue ring-1 ring-teamA/40">
            <Target className="h-9 w-9 text-teamA" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Flanki <span className="text-teamA">Hub</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Twoja centrala rozgrywek terenowych
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {(view === 'login' || view === 'register') && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
              <button
                onClick={() => setView('login')}
                className={
                  'rounded-lg py-2.5 text-sm font-semibold transition-colors ' +
                  (view === 'login'
                    ? 'bg-teamA text-slate-950'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                Logowanie
              </button>
              <button
                onClick={() => setView('register')}
                className={
                  'rounded-lg py-2.5 text-sm font-semibold transition-colors ' +
                  (view === 'register'
                    ? 'bg-teamA text-slate-950'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                Rejestracja
              </button>
            </div>
          )}

          {view === 'forgot' && (
            <button
              onClick={() => setView('login')}
              className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Wróć do logowania
            </button>
          )}

          <form onSubmit={submit} className="space-y-4">
            {view === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nazwa gracza</Label>
                <Field icon={User}>
                  <Input id="name" placeholder="np. Wiktor" required />
                </Field>
              </div>
            )}

            {(view === 'login' ||
              view === 'register' ||
              view === 'forgot') && (
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Field icon={Mail}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ty@stud.prz.edu.pl"
                    required
                  />
                </Field>
              </div>
            )}

            {view !== 'forgot' && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Hasło</Label>
                <Field icon={Lock}>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </Field>
              </div>
            )}

            {(view === 'register' || view === 'reset') && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Potwierdź hasło</Label>
                <Field icon={ShieldCheck}>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </Field>
              </div>
            )}

            {view === 'register' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="university">Uczelnia</Label>
                  <Select
                    id="university"
                    value={university}
                    onValueChange={(v) => {
                      setUniversity(v as UniversityChoice)
                      setFaculty(null)
                    }}
                    options={UNIVERSITIES.map((u) => ({
                      value: u.value,
                      label: u.label,
                    }))}
                    placeholder="Wybierz uczelnię"
                  />
                </div>
                {showFaculty && (
                  <div className="space-y-1.5 animate-slide-up">
                    <Label htmlFor="faculty">Wydział</Label>
                    <Select
                      id="faculty"
                      value={faculty}
                      onValueChange={setFaculty}
                      options={FACULTIES.map((f) => ({
                        value: f.value,
                        label: f.label,
                      }))}
                      placeholder="Wybierz wydział"
                    />
                  </div>
                )}
              </>
            )}

            {view === 'reset' && (
              <div className="rounded-xl border border-teamA/30 bg-teamA/10 p-3 text-xs text-teamA">
                <KeyRound className="mb-1 inline h-4 w-4" /> Ustawiasz nowe hasło
                z linku przesłanego na e-mail.
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              {view === 'login' && 'Zaloguj się'}
              {view === 'register' && 'Utwórz konto'}
              {view === 'forgot' && 'Wyślij link resetu'}
              {view === 'reset' && 'Ustaw nowe hasło'}
            </Button>
          </form>

          {view === 'login' && (
            <button
              onClick={() => setView('forgot')}
              className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-teamA"
            >
              Nie pamiętasz hasła?
            </button>
          )}
        </div>

        {view === 'login' && (
          <button
            onClick={() => setView('reset')}
            className="mx-auto mt-4 block text-xs text-muted-foreground/70 hover:text-muted-foreground"
          >
            Podgląd: ekran „Ustaw nowe hasło”
          </button>
        )}
      </div>
    </div>
  )
}
