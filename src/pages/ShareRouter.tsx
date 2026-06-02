import PublicSharePage from "./PublicSharePage";

// Single-admin app: any /share/:userId resolves to the same public page.
const ShareRouter = () => <PublicSharePage />;

export default ShareRouter;
