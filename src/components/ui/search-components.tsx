import { format } from "date-fns";
import { Link } from "react-router";

export function SectionHeader({ title, count, actionText, onAction }: { title: string, count?: number, actionText?: string, onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-2">
      <h2 className="text-[15px] font-semibold text-[#F0F0EA]">
        {title} {count !== undefined && <span className="text-[#9A9A8E] font-normal">({count} results)</span>}
      </h2>
      {actionText && onAction && (
        <button onClick={onAction} className="text-[12px] text-[#9A9A8E] hover:text-[#F0F0EA] transition-colors">
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
      className="w-[100px] h-[100px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform bg-[#242422] border border-[#2E2E2C]"
    >
      <Icon className="h-5 w-5 text-[#FF6B35]" strokeWidth={2} />
      <span className="text-[14px] font-semibold text-[#F0F0EA]">{vibe}</span>
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
        <div className="w-12 h-12 bg-[#2C2C2A] border border-[#2E2E2C] rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
          {data.cover_image_url ? (
            <img src={data.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[8px] font-bold text-[#FF6B35]/30 uppercase tracking-wide">Gather</span>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <p className="text-[15px] font-semibold text-[#F0F0EA] truncate leading-snug">{data.title}</p>
          <p className="text-[12px] text-[#9A9A8E] truncate mt-1">
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
    >
      <div className="w-10 h-10 bg-[#FF6B35] text-white rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[16px] font-semibold">
        {data.avatar_url ? (
          <img src={data.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          (data.display_name || '?').charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1 justify-center">
        <p className="text-[15px] font-semibold text-[#F0F0EA] truncate leading-snug">{data.display_name}</p>
        <p className="text-[12px] text-[#9A9A8E] truncate mt-0.5">
          Hosting {data._count?.events || data.events_count || 0} events
        </p>
      </div>
    </div>
  );
}
