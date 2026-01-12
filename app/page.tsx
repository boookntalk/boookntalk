import Header from '@/components/layout/Header'

export default function Home() {
  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative h-[420px] bg-gray-900 text-white">
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <p className="mb-4 text-sm uppercase tracking-widest opacity-80">
                Today’s Quote
              </p>
              <h1 className="text-3xl font-light leading-relaxed">
                “우리가 읽는 책이 우리 머리를 주먹으로<br />
                한 대 쳐서 깨우지 않는다면, 무엇 때문에 읽는가?”
              </h1>
              <p className="mt-4 text-sm opacity-80">
                — 프란츠 카프카
              </p>
            </div>
          </div>
        </section>

        {/* Plaza Highlight (placeholder) */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-xl font-semibold">
            실시간 광장 하이라이트
          </h2>
        </section>
      </main>
    </>
  )
}
