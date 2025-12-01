const CandleLoader = () => {
  return (
    <div className="flex items-end gap-1 h-12">
      <div className="w-3 bg-primary/80 rounded-sm animate-pulse" style={{ 
        height: '60%', 
        animationDelay: '0ms',
        animationDuration: '1s'
      }} />
      <div className="w-3 bg-accent-blue/80 rounded-sm animate-pulse" style={{ 
        height: '40%', 
        animationDelay: '150ms',
        animationDuration: '1s'
      }} />
      <div className="w-3 bg-primary/80 rounded-sm animate-pulse" style={{ 
        height: '80%', 
        animationDelay: '300ms',
        animationDuration: '1s'
      }} />
      <div className="w-3 bg-accent-blue/80 rounded-sm animate-pulse" style={{ 
        height: '55%', 
        animationDelay: '450ms',
        animationDuration: '1s'
      }} />
      <div className="w-3 bg-primary/80 rounded-sm animate-pulse" style={{ 
        height: '70%', 
        animationDelay: '600ms',
        animationDuration: '1s'
      }} />
    </div>
  );
};

export default CandleLoader;
