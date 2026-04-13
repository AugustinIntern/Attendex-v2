"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Archive, Loader2, ShieldAlert } from "lucide-react";

interface Employee {
  user_id: number;
  emp_code: string;
}

interface ArchiveEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
  isArchiving: boolean;
}

export default function ArchiveEmployeeModal({
  isOpen,
  onClose,
  onConfirm,
  employee,
  isArchiving,
}: ArchiveEmployeeModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText === employee?.emp_code) {
      onConfirm();
    }
  };

  const isMatch = employee ? confirmText === employee.emp_code : false;

  const handleClose = () => {
    if (!isArchiving) {
      onClose();
      setConfirmText("");
    }
  };

  return (
    <Dialog open={isOpen && !!employee} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-destructive/20 p-0 overflow-hidden gap-0">
        <DialogHeader className="p-8 border-b border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
              <ShieldAlert className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-destructive">
                Deactivate Record
              </DialogTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                Irreversible action — confirm carefully
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="p-8 space-y-6">
          <div className="bg-destructive/5 rounded-2xl p-5 border border-destructive/20 space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-widest">Warning</p>
            </div>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Archiving will remove{" "}
              <span className="font-black text-foreground font-mono bg-muted px-2 py-0.5 rounded-lg">
                {employee?.emp_code}
              </span>{" "}
              from the active workforce. All telemetry records are preserved and can be restored from Cold Storage.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmText" className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <Archive className="w-4 h-4 text-destructive" />
              Type{" "}
              <code className="font-mono bg-muted/70 px-2 py-0.5 rounded-lg text-foreground">
                {employee?.emp_code}
              </code>{" "}
              to confirm
            </label>
            <Input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={employee?.emp_code}
              className={`h-14 rounded-xl bg-muted/20 font-bold px-5 text-base font-mono transition-colors ${
                isMatch
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-muted"
              }`}
              required
              disabled={isArchiving}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isArchiving}
              className="flex-1 h-14 rounded-xl border-muted font-black text-xs uppercase tracking-widest hover:bg-muted/40"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isMatch || isArchiving}
              variant="destructive"
              className="flex-1 h-14 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-destructive/20 disabled:opacity-30"
            >
              {isArchiving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Deactivate
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
