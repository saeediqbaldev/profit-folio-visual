import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ProgressToastProps {
  title: string;
  progress: number;
  isVisible: boolean;
  status?: "loading" | "success" | "error";
  message?: string;
  totalCount?: number;
  loadedCount?: number;
}

const ProgressToast = ({ title, progress, isVisible, status = "loading", message, totalCount, loadedCount }: ProgressToastProps) => {
  const [show, setShow] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  
  useEffect(() => {
    if (isVisible && progress > 0) {
      setShow(true);
    } else if (!isVisible && progress === 0) {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, progress]);

  // Smooth progress animation
  useEffect(() => {
    if (progress > displayProgress) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(prev + 2, progress));
      }, 20);
      return () => clearTimeout(timer);
    } else if (progress < displayProgress) {
      setDisplayProgress(progress);
    }
  }, [progress, displayProgress]);

  // Auto-hide after completion
  useEffect(() => {
    if (progress >= 100 && (status === "success" || status === "error")) {
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [progress, status]);

  if (!show) return null;

  const isComplete = progress >= 100;
  const isError = status === "error";
  const isSuccess = status === "success" || (isComplete && !isError);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-elegant p-6 min-w-[320px] max-w-[400px]">
          <div className="flex items-center gap-3 mb-3">
            {isError ? (
              <XCircle className="h-6 w-6 text-destructive animate-in zoom-in duration-200" />
            ) : isSuccess ? (
              <CheckCircle className="h-6 w-6 text-success animate-in zoom-in duration-200" />
            ) : (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            )}
            <span className="font-semibold text-base">{title}</span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={displayProgress} 
              className={`h-2.5 ${isError ? "[&>div]:bg-destructive" : isSuccess ? "[&>div]:bg-success" : ""}`} 
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {message || (isError ? "Failed!" : isSuccess ? "Complete!" : "Processing...")}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressToast;
