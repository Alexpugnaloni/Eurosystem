import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/worker");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">

      <Card className="w-full max-w-sm shadow-sm">

        <CardHeader className="text-center space-y-3">

          <div className="flex justify-center">
            <Image
              src="/logo/eurosystem.png"
              alt="Eurosystem"
              width={140}
              height={40}
              priority
            />
          </div>

          <CardTitle className="text-xl">
            Login
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Accedi per inserire la produzione.
          </p>

        </CardHeader>

        <CardContent className="space-y-4">

          <LoginForm />

          <div className="text-xs text-muted-foreground text-center">
            Seed: <b>admin/admin123</b> — <b>mrossi/operaio123</b>
          </div>

        </CardContent>

      </Card>

    </div>
  );
}