import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          boookntalk
        </Link>
        <nav className="flex gap-4">
          <Link href="/" className="text-slate-600 hover:text-indigo-600">홈</Link>
          <Link href="/about" className="text-slate-600 hover:text-indigo-600">소개</Link>
        </nav>
      </div>
    </header>
  );
}