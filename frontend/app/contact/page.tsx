import { PolicyPage } from '@/components/policy-page';

export default function ContactPage() {
  return (
    <PolicyPage
      eyebrow="/contact/"
      title="문의/광고 문의"
      description="서비스 운영, 게시물 신고 보강, 광고 문의는 아래 기준으로 접수합니다."
      sections={[
        {
          title: '운영 문의',
          body: '서비스 오류, 정책 문의, 권리 침해 관련 문의는 운영자가 확인할 수 있도록 구체적인 주소와 사유를 함께 전달해 주세요.',
        },
        {
          title: '광고 문의',
          body: '카테고리와 어울리는 배너 광고, 직접 광고, 제휴 제안을 받을 수 있습니다. 광고 목적, 희망 기간, 랜딩 페이지, 예산 범위를 함께 보내주시면 검토가 빨라집니다.',
        },
        {
          title: '연락처',
          body: '공개 운영 전 임시 연락처는 contact@example.com 입니다. 실제 운영 전 전용 메일 주소로 교체할 예정입니다.',
        },
      ]}
    />
  );
}
