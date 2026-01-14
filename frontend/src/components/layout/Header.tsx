export default function Header() {
  return (
    <header className="border-b border-slate-100 py-6">
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo: B(미니멀) 톤 적용 - boookntalk */}
        <h1 className="text-xl font-light tracking-[0.15em] lowercase">
          boook<span className="font-medium text-slate-400">n</span>talk
        </h1>
        
        <nav className="flex items-center gap-8 text-sm font-medium text-slate-500">
          <button className="hover:text-black transition-colors">PLAZA</button>
          <button className="hover:text-black transition-colors">TIMELINE</button>
          <div className="h-4 w-[1px] bg-slate-200"></div>
          <button className="px-4 py-2 border border-slate-200 rounded-full text-xs hover:bg-slate-50">
            SIGN IN
          </button>
        </nav>
      </div>
    </header>
  );
}