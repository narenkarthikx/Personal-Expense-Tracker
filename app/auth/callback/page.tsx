"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleEmailVerification = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error handling email verification:", error);
        router.push("/login?error=verification-failed");
        return;
      }

      if (session) {
        // User is logged in after email verification
        router.push("/");
      } else {
        // User needs to login
        router.push("/login?verified=true");
      }
    };

    handleEmailVerification();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium mb-2">Verifying your email...</h2>
        <p className="text-gray-600">Please wait while we complete the verification process.</p>
      </div>
    </div>
  );
}
