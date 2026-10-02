import SignInForm from "@/components/sign-in-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">
      <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="text-accent-mauve">LancerMents</span>: Tactical
        Configuration Blueprint
      </h1>
      <SignInForm redirectPath="/dashboard" />
    </main>
  );
}
