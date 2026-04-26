import Link from 'next/link';

type AdSlotVariant = 'top' | 'footer' | 'side' | 'inline';

const variantClass: Record<AdSlotVariant, string> = {
  top: 'ad-slot-top',
  footer: 'ad-slot-top',
  side: 'ad-slot-side',
  inline: 'ad-slot-inline',
};

const variantLabel: Record<AdSlotVariant, string> = {
  top: '커뮤니티 리더보드',
  footer: '하단 리더보드',
  side: '사이드 스폰서',
  inline: '본문 스폰서',
};

export function AdSlot({
  variant,
  label,
}: {
  variant: AdSlotVariant;
  label?: string;
}) {
  return (
    <Link className={`ad-slot ${variantClass[variant]}`} href="/advertise">
      <span>{label || variantLabel[variant]}</span>
      <small>광고 문의</small>
    </Link>
  );
}
