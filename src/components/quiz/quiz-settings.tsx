import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QuizSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [timeLimit, setTimeLimit] = useState(45);
  const [shuffle, setShuffle] = useState(true);
  const [showResult, setShowResult] = useState(true);
  const [allowRetry, setAllowRetry] = useState(false);
  const [maxRetries, setMaxRetries] = useState(3);
  const [passScore, setPassScore] = useState(50);
  const [difficulty, setDifficulty] = useState("medium");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thiết lập bộ đề</DialogTitle>
          <DialogDescription>Cấu hình quy tắc và hiển thị bộ đề.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Time limit */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <Label className="text-sm">Thời gian làm bài (phút)</Label>
              <p className="text-xs text-muted-foreground">0 = không giới hạn</p>
            </div>
            <Input
              type="number"
              min={0}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-20 text-center"
            />
          </div>

          {/* Pass score */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <Label className="text-sm">Điểm đạt (%)</Label>
              <p className="text-xs text-muted-foreground">Phần trăm điểm tối thiểu để đạt</p>
            </div>
            <Input
              type="number"
              min={0}
              max={100}
              value={passScore}
              onChange={(e) => setPassScore(Number(e.target.value))}
              className="w-20 text-center"
            />
          </div>

          {/* Difficulty */}
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <Label className="text-sm">Độ khó</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Dễ</SelectItem>
                <SelectItem value="medium">Trung bình</SelectItem>
                <SelectItem value="hard">Khó</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Trộn câu hỏi ngẫu nhiên</Label>
              <Switch checked={shuffle} onCheckedChange={setShuffle} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Hiển thị kết quả sau khi nộp</Label>
              <Switch checked={showResult} onCheckedChange={setShowResult} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Cho phép làm lại</Label>
              <Switch checked={allowRetry} onCheckedChange={setAllowRetry} />
            </div>
            {allowRetry && (
              <div className="flex items-center justify-between pl-4">
                <Label className="text-xs text-muted-foreground">Số lần làm lại tối đa</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className="h-7 w-16 text-center text-xs"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              className="bg-primary text-white hover:bg-primary-hover"
              onClick={() => {
                toast.success("Đã lưu thiết lập bộ đề");
                onOpenChange(false);
              }}
            >
              Lưu thiết lập
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
