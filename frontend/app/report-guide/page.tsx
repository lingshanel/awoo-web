import { PolicyPage } from '@/components/policy-page';

export default function ReportGuidePage() {
  return (
    <PolicyPage
      eyebrow="/report/"
      title="신고 안내"
      description="신고는 운영자가 문제 게시물을 빠르게 확인하기 위한 기능입니다. 명확한 사유를 남기면 처리 속도가 빨라집니다."
      sections={[
        {
          title: '신고 대상',
          body: '개인정보 노출, 불법 콘텐츠, 스팸, 도배, 괴롭힘, 카테고리와 무관한 반복 게시물을 신고할 수 있습니다.',
        },
        {
          title: '처리 방식',
          body: '운영자는 신고 사유와 대상 내용을 확인한 뒤 해결 처리하거나, 필요한 경우 스레드 또는 댓글을 숨김 처리합니다.',
        },
        {
          title: '긴급 문의',
          body: '즉시 조치가 필요한 법적 또는 안전 이슈는 문의/광고 문의 페이지의 연락처로 별도 접수해 주세요.',
        },
      ]}
    />
  );
}
