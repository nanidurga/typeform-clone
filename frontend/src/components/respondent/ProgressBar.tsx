export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="fixed inset-x-0 top-0 z-30 h-1 bg-accent/15">
      <div
        className="h-full bg-accent transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
