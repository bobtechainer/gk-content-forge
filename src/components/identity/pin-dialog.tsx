import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useIdentity } from "@/stores/identity";
import type { ProfileRef } from "@/lib/org/permissions";

const PIN_LENGTH = 4;

interface PinDialogProps {
  /** Hồ sơ cần mở khoá. Khi null → dialog đóng. */
  profile: ProfileRef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi khi nhập đúng PIN; truyền membershipId để màn cha mở hồ sơ. */
  onVerified: (membershipId: string) => void;
}

export function PinDialog({ profile, open, onOpenChange, onVerified }: PinDialogProps) {
  const verifyPin = useIdentity((s) => s.verifyPin);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Reset trạng thái mỗi lần mở cho hồ sơ khác.
  useEffect(() => {
    if (open) {
      setPin("");
      setError(false);
    }
  }, [open, profile?.membership.id]);

  const submit = (value: string) => {
    if (!profile) return;
    if (verifyPin(profile.membership.id, value)) {
      onVerified(profile.membership.id);
      onOpenChange(false);
      return;
    }
    setError(true);
    setPin("");
  };

  const handleChange = (value: string) => {
    setError(false);
    setPin(value);
    if (value.length === PIN_LENGTH) submit(value);
  };

  const nodeName = profile?.node?.name ?? "Hồ sơ";
  const avatarColor = profile?.node?.avatarColor;
  const shortName = profile?.node?.shortName ?? "HS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <span
            className="mb-2 flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold text-white"
            style={avatarColor ? { backgroundColor: avatarColor } : undefined}
          >
            {shortName}
          </span>
          <DialogTitle className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Nhập mã PIN
          </DialogTitle>
          <DialogDescription>
            Hồ sơ <span className="font-medium text-foreground">{nodeName}</span> được bảo vệ bằng mã
            PIN. Nhập 4 chữ số để tiếp tục.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <InputOTP
            maxLength={PIN_LENGTH}
            value={pin}
            onChange={handleChange}
            autoFocus
            aria-label="Mã PIN hồ sơ"
          >
            <InputOTPGroup>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            Mã PIN demo: <span className="font-mono font-semibold text-foreground">1234</span>
          </p>
          {error && (
            <p className="text-sm font-medium text-destructive">Mã PIN không đúng. Thử lại nhé.</p>
          )}
        </div>

        <Button
          className="w-full"
          disabled={pin.length !== PIN_LENGTH}
          onClick={() => submit(pin)}
        >
          Mở hồ sơ
        </Button>
      </DialogContent>
    </Dialog>
  );
}
