import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2 } from "lucide-react";

interface ProgressToastProps {
  title: string;
  progress: number;
  isVisible: boolean;
}

const ProgressToast = ({ title, progress, isVisible }: ProgressToastProps) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (isVisible && progress > 0) {
      setShow(true);
    } else if (progress >= 100) {
      const timer = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timer);
    } else if (!isVisible) {
      setShow(false);
    }
  }, [isVisible, progress]);

  if (!show) return null;

  const isComplete = progress >= 100;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-lg shadow-elegant p-4 min-w-[280px] max-w-[350px]">
        <div className="flex items-center gap-3 mb-2">
          {isComplete ? (
            <CheckCircle className="h-5 w-5 text-success animate-in zoom-in duration-200" />
          ) : (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          )}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {isComplete ? "Complete!" : `${Math.round(progress)}%`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressToast;