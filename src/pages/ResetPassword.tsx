import React, { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2EF] flex items-center justify-center font-['Inter'] px-4">
      <div className="bg-white p-8 rounded-xl w-full max-w-sm shadow-sm flex flex-col items-center">
        <h1 className="text-[22px] font-bold text-[#1A1A1A] mb-6">Reset Password</h1>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="w-full h-[52px] rounded-full border border-gray-300 px-5 text-[16px] text-[#1A1A1A] placeholder:text-neutral-400 outline-none focus:border-[#FF6B35] transition-colors"
          />
          
          <button
            type="submit"
            disabled={loading || password.length < 6}
            className="w-full h-[52px] rounded-full bg-[#FF6B35] text-white text-[16px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e55f2d] active:scale-[0.98] transition-all"
          >
            {loading ? "Saving..." : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
