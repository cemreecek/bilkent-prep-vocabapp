'use client';

import React, { useState } from 'react';
import { resetPasswordAction } from '@/app/actions/user';

export default function ResetPasswordButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const newPassword = window.prompt("Enter new password for this user:");
    if (!newPassword) return;

    setLoading(true);
    const res = await resetPasswordAction(userId, newPassword);
    setLoading(false);

    if (res.success) {
      alert("Password reset successfully.");
    } else {
      alert(res.error || "Failed to reset password.");
    }
  };

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="p-2 text-[color:var(--color-on-surface-variant)] hover:text-[color:var(--color-error)] hover:bg-[color:var(--color-error)]/10 rounded-full transition-colors"
      title="Reset Password"
    >
      <span className="material-symbols-outlined text-[20px]">key</span>
    </button>
  );
}
