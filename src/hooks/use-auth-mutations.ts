import { useMutation } from "@tanstack/react-query";
import { authService } from "@/lib/auth-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constant";

export function useLoginMutation() {
  return useMutation({
    mutationFn: authService.login,
    onError: (error: any) => {
      // Error handling is done in component or here
      // console.error("Login failed", error);
    },
  });
}

export function useVerify2FAMutation() {
  return useMutation({
    mutationFn: authService.verify2FA,
    onError: (error: any) => {
      console.error("2FA Verification failed", error);
    },
  });
}

export function useLogoutMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      router.push(ROUTES.AUTH.LOGIN);
      toast.success("Logged out successfully");
    },
    onError: (error: any) => {
      console.error("Logout failed", error);
      // Force logout anyway on client side usually
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (data: { email: string; callbackUrl: string }) =>
      authService.forgotPassword(data.email, data.callbackUrl),
    onSuccess: () => {
      toast.success("Password reset link sent to your email");
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      authService.resetPassword(data.token, data.password),
    onSuccess: () => {
      toast.success("Password reset successfully");
    },
  });
}
