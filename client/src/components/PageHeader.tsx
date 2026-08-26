export default function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-[#1B4332]/10 pb-6 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C2871F]">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#153126] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </header>
  );
}
