"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, AlertCircle, Fingerprint, Hash, Loader2 } from "lucide-react";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [empCode, setEmpCode] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_code: empCode.toUpperCase(),
          user_id: parseInt(userId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add employee");
      }

      onSuccess();
      onClose();
      setEmpCode("");
      setUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-muted p-0 overflow-hidden gap-0">
        <DialogHeader className="p-8 border-b border-muted bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <UserPlus className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Register Personnel
              </DialogTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                New system enrollment
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="empCode" className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
              <Fingerprint className="w-4 h-4 text-primary" />
              Employee Code
            </label>
            <Input
              id="empCode"
              type="text"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value.toUpperCase())}
              placeholder="e.g., MBX8, BLK2"
              className="h-14 rounded-xl border-muted bg-muted/20 font-bold px-5 focus:border-primary text-base"
              required
              pattern="^[A-Z]{3}\d$"
              title="Employee code must be in format: XXX# (e.g., MBX8, BLK2)"
            />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Format: 3 letters + 1 digit (e.g., MBX8)
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="userId" className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
              <Hash className="w-4 h-4 text-primary" />
              Device User ID
            </label>
            <Input
              id="userId"
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g., 5"
              className="h-14 rounded-xl border-muted bg-muted/20 font-bold px-5 focus:border-primary text-base"
              required
              min="1"
            />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Biometrics device enrollment ID
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-14 rounded-xl border-muted font-black text-xs uppercase tracking-widest hover:bg-muted/40"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-14 rounded-xl font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}