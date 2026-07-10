import { SignIn } from "@clerk/nextjs";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center gap-8 bg-dotgrid px-4 py-10 sm:px-6 sm:py-16"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="eyebrow text-muted-foreground">Operator access</p>
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em]">
            Sign in to the control room
          </h1>
        </div>
        <SignIn />
      </main>
      <SiteFooter />
    </div>
  );
}
