import { format } from "date-fns";
import { Link } from "react-router";

export function SectionHeader({ title, count, actionText, onAction }: { title: string, count?: number, actionText?: string, onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2">
      <h2 className="text-[15px] font-semibold text-[#1A1A1A]">
        {title} {count !== undefined && <span className="text-neutral-400 font-normal">({count} results)</span>}
      </h2>
      {actionText && onAction && (
        <button onClick={onAction} className="text-[12px] text-neutral-500 hover:text-neutral-900 transition-colors">
          {actionText}
        </button>
      )}
    </div>
  );
}

export function VibeCard({ vibe, color, icon: Icon, onClick }: { vibe: string, color: string, icon: React.ElementType, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-[100px] h-[100px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform`}
      style={{ backgroundColor: color }}
    >
      <Icon className="h-5 w-5 text-neutral-700" strokeWidth={2} />
      <span className="text-[14px] font-semibold text-neutral-900">{vibe}</span>
    </button>
  );
}

export function SearchResultRow({ type, data, onClick }: { type: 'event' | 'user', data: any, onClick?: () => void }) {
  if (type === 'event') {
    return (
      <Link 
        to={`/event/${data.id}`} 
        onClick={onClick}
        className="flex items-center gap-3 py-1.5 active:scale-[0.99] transition-transform"
      >
        <div className="w-12 h-12 bg-[#F5F5F2] rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
          {data.cover_image_url ? (
            <img src={data.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px] font-bold text-primary/30 uppercase tracking-wide">Gather</span>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <p className="text-[15px] font-semibold text-neutral-900 truncate leading-snug">{data.title}</p>
          <p className="text-[12px] text-neutral-500 truncate mt-1">
            {data._count?.attendees || data.attendee_count || 0} going <span className="mx-0.5">·</span> {data.event_datetime ? format(new Date(data.event_datetime), 'E h:mm a') : 'TBD'}
          </p>
        </div>
      </Link>
    );
  }

  // User type
  return (
    <div 
      className="flex items-center gap-3 py-1.5 cursor-not-allowed opacity-80" 
      onClick={onClick}
      // TODO: Replace with Link to public profile when implemented
    >
      <div className="w-10 h-10 bg-primary text-white rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[16px] font-semibold">
        {data.avatar_url ? (
          <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          (data.display_name || '?').charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <p className="text-[15px] font-semibold text-neutral-900 truncate leading-snug">{data.display_name}</p>
        <p className="text-[12px] text-neutral-500 truncate mt-0.5">
          Hosting {data._count?.events || data.events_count || 0} events
        </p>
      </div>
    </div>
  );
}
