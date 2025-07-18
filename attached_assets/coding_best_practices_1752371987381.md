# coding_best_practices.md - 코딩 베스트 프랙티스

## 파일 구조
- **기능 단위로 컴포넌트를 나눈다.**
- 페이지, 컴포넌트, 유틸, 데이터, API 등 디렉토리를 명확히 구분한다.

## 코드 스타일
- 변수/함수/컴포넌트는 이름만 봐도 역할을 알 수 있게 짓는다.
- 예: `calculateDistance`, `TaskCard`, `useTaskStatus`

## 주석
- 함수 위에는 기능 설명 주석을 달아준다.
- 복잡한 로직에는 인라인 주석으로 의도를 설명한다.

## 반복 방지 (DRY)
- 반복되는 코드는 함수 또는 컴포넌트로 분리한다.

## 버전 관리 (Git)
- 의미 있는 커밋 메시지 작성
  - ✅ `feat: 심부름 요청 폼 UI 제작`
  - ✅ `fix: 거리 계산 버그 수정`
  - ❌ `수정`, `테스트중`

## 테스트
- 모든 기능은 로컬 테스트 후 푸시
- 미래에 대비해 테스트 코드 작성 고려

## 기타
- 가능하면 함수는 pure하게 만들기
- 불변성을 유지 (특히 상태관리에서)

