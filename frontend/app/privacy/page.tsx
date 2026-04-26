import { PolicyPage } from '@/components/policy-page';

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="/privacy/"
      title="개인정보처리방침"
      description="AWOO/KR은 익명 사용을 기본으로 하며, 서비스 운영과 보안에 필요한 최소 정보만 처리하는 방향을 지향합니다."
      sections={[
        {
          title: '수집되는 정보',
          body: '작성자가 입력한 이름, 게시 내용, 수정/삭제 비밀번호의 해시값, 업로드 파일 정보, 신고 처리와 스팸 방어를 위한 비식별 해시 정보가 저장될 수 있습니다.',
        },
        {
          title: '이용 목적',
          body: '저장된 정보는 게시물 표시, 신고 처리, 스팸 방어, 서비스 안정성 유지 목적으로 사용됩니다.',
        },
        {
          title: '보관과 삭제',
          body: '문제가 있는 게시물은 숨김 처리될 수 있으며, 운영 정책과 법적 필요에 따라 관련 기록이 일정 기간 보관될 수 있습니다.',
        },
        {
          title: '광고와 외부 서비스',
          body: '공개 운영 단계에서 광고 네트워크나 제휴 링크가 도입될 수 있으며, 이 경우 광고 제공자가 쿠키 또는 유사 기술을 사용할 수 있습니다. 적용 전 관련 안내를 보강합니다.',
        },
      ]}
    />
  );
}
