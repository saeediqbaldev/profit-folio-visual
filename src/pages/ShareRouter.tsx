import { useParams } from "react-router-dom";
import PublicSharePage from "./PublicSharePage";

const ShareRouter = () => {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid share link</p>
      </div>
    );
  }

  return <PublicSharePage userId={userId} />;
};

export default ShareRouter;
