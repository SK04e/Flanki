import { ToastProvider } from "@/components/ui/toast"
import { FlankiApp } from "@/components/flanki-app"

export default function Page() {
  return (
    <ToastProvider>
      <FlankiApp />
    </ToastProvider>
  )
}
