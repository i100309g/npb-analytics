import { latestReport } from "../../prisma/seed-data/report-data";

export const metadata = {
  title: "セイバーメトリクス注目株 | NPB Analytics",
  description: "Claude AIによるNPB成績分析レポート",
};

type BattingHighlight = typeof latestReport.battingHighlights[number];
type PitchingHighlight = typeof latestReport.pitchingHighlights[number];

function BatterCard({ p }: { p: BattingHighlight }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <span className="text-gray-500 text-sm mr-2">#{p.rank}</span>
          <span className="font-bold text-lg text-white">{p.playerName}</span>
          <span className="text-gray-400 text-sm ml-2">{p.teamName}</span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-gray-500 block">wOBA</span>
          <span className="text-xl font-mono font-bold text-emerald-400">
            {p.wOBA.toFixed(3)}
          </span>
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-4">{p.highlight}</p>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {[
          { label: "OPS", value: p.ops.toFixed(3) },
          { label: "AVG", value: p.avg.toFixed(3) },
          { label: "HR",  value: p.homeRuns },
          { label: "RBI", value: p.rbi },
          { label: "PA",  value: p.plateAppearances },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded p-2">
            <div className="text-gray-500 mb-1">{label}</div>
            <div className="font-mono font-semibold text-gray-200">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PitcherCard({ p }: { p: PitchingHighlight }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <span className="text-gray-500 text-sm mr-2">#{p.rank}</span>
          <span className="font-bold text-lg text-white">{p.playerName}</span>
          <span className="text-gray-400 text-sm ml-2">{p.teamName}</span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-gray-500 block">ERA</span>
          <span className="text-xl font-mono font-bold text-blue-400">
            {p.era.toFixed(2)}
          </span>
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-4">{p.highlight}</p>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {[
          { label: "WHIP", value: p.whip.toFixed(2) },
          { label: "K/9",  value: p.kPer9.toFixed(1) },
          { label: "W",    value: p.wins },
          { label: "SV",   value: p.saves },
          { label: "IP",   value: p.inningsPitched.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded p-2">
            <div className="text-gray-500 mb-1">{label}</div>
            <div className="font-mono font-semibold text-gray-200">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const report = latestReport;
  const hasData = report.date !== "" && (
    report.battingHighlights.length > 0 || report.pitchingHighlights.length > 0
  );

  if (!hasData) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">📊</p>
        <h1 className="text-2xl font-bold text-white mb-2">分析レポート準備中</h1>
        <p className="text-gray-400">
          GitHub Actions が毎日 00:00 JST にセイバーメトリクス分析を実行します。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">
            {report.season}年 セイバーメトリクス注目株
          </h1>
          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
            AI分析
          </span>
        </div>
        <p className="text-gray-500 text-sm">{report.date} 生成</p>
      </div>

      {/* リーグ全体コメント */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
          今週のリーグトレンド
        </h2>
        <p className="text-gray-200 leading-relaxed">{report.overview}</p>
      </div>

      {/* 打撃部門 */}
      {report.battingHighlights.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">⚾</span> 打撃部門 注目選手
          </h2>
          <div className="space-y-4">
            {report.battingHighlights.map((p) => (
              <BatterCard key={p.playerId} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* 投手部門 */}
      {report.pitchingHighlights.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400">⚡</span> 投手部門 注目選手
          </h2>
          <div className="space-y-4">
            {report.pitchingHighlights.map((p) => (
              <PitcherCard key={p.playerId} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* フッター */}
      <p className="text-xs text-gray-600 text-right">
        Powered by Claude (claude-opus-4-8) · {report.generatedAt}
      </p>
    </div>
  );
}
