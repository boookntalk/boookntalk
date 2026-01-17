import React from 'react';

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <section className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">당신의 문장을 들려주세요</h2>
          <p className="text-slate-500">책에서 만난 대화, 우리들의 기록 boookntalk</p>
        </section>

        {/* Timeline Post Example */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">B</div>
            <div>
              <p className="text-sm font-bold text-slate-800">boookntalk 팀</p>
              <p className="text-xs text-slate-400">방금 전</p>
            </div>
          </div>
          <p className="text-slate-700 leading-relaxed italic border-l-4 border-indigo-200 pl-4 mb-4">
            "모든 책은 독자가 그것을 읽을 때 비로소 완성된다."
          </p>
          <div className="text-sm font-medium text-indigo-500">#환영합니다 #첫기록</div>
        </div>
      </div>
    </main>
  );
}