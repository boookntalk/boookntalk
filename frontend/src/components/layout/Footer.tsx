export default function Footer() {
  return (
    <footer className="border-t border-slate-100 py-12 bg-slate-50/50">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="max-w-sm">
          <p className="text-xs text-slate-400 leading-relaxed tracking-tight">
            boookntalk — 책은 소유가 아닌 시간과 기억의 기록입니다. 
            우리는 당신의 독서 궤적을 구조화된 아카이브로 보존하고 연결합니다.
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400">
          © 2026 boookntalk System. All rights reserved.
        </div>
      </div>
    </footer>
  );
}