export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      {children}
    </div>
  );
}
