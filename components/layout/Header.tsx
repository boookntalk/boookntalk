export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Logo */}
        <div className="text-xl font-semibold">
          BoooknTalk
        </div>

        {/* Global Search */}
        <div className="flex-1 px-8">
          <input
            type="text"
            placeholder="ISBN, 제목, 저자 통합 검색"
            className="w-full rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button>KO</button>
          <button>EN</button>
          <button>JA</button>
          <button className="rounded-md border px-3 py-1">
            구글 로그인
          </button>
        </div>

      </div>
    </header>
  )
}
