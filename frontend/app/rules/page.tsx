import { PolicyPage } from '@/components/policy-page';

export default function RulesPage() {
  return (
    <PolicyPage
      eyebrow="/rules/"
      title="이용규칙"
      description="AWOO/KR은 익명으로 가볍게 이야기할 수 있는 공간을 목표로 하지만, 공개 운영을 위해 최소한의 기준을 둡니다."
      sections={[
        {
          title: '금지되는 내용',
          body: '개인정보 노출, 불법 촬영물, 저작권 침해물, 범죄 조장, 혐오 또는 괴롭힘 목적의 게시물은 허용하지 않습니다.',
        },
        {
          title: '스레드와 댓글 운영',
          body: '운영자는 신고, 법적 위험, 스팸 여부를 기준으로 스레드와 댓글을 숨김 처리할 수 있습니다.',
        },
        {
          title: '이미지 업로드',
          body: '이미지는 게시 목적에 맞는 범위에서만 업로드할 수 있으며, 문제 소지가 있는 이미지는 예고 없이 제거될 수 있습니다.',
        },
      ]}
    />
  );
}
