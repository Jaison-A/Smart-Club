import Card from './Card';

// trend is optional: a small "+12% this month"-style delta. Omit it for
// stats where a trend doesn't make sense (e.g. a point-in-time count).
export default function StatCard({ label, value, icon: Icon, trend, trendDirection = 'up' }) {
  return (
    <Card accent>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trendDirection === 'up' ? 'text-success' : 'text-danger'}`}>
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-md bg-primary/5 p-2.5 text-primary">
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </Card>
  );
}
