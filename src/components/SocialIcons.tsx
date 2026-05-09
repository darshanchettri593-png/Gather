export function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="#FF6B35" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4.5" stroke="#FF6B35" strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1" fill="#FF6B35"/>
    </svg>
  );
}

export function TwitterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L10.5 12.5L4 20H6.5L11.5 14L16 20H20L13.5 11.5L20 4H17.5L12.5 10L8 4H4Z" stroke="#FF6B35" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="#FF6B35" strokeWidth="1.8"/>
      <path d="M13 8h1.5V6H13c-1.7 0-3 1.3-3 3v1H8.5v2H10v6h2v-6h1.5l.5-2H12V9c0-.6.4-1 1-1z" stroke="#FF6B35" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
