# 온맘다해 GitHub + Cloudflare 설정

## 1. GitHub에 올리기

이 ZIP의 `onmamdahae-cloudflare` 폴더 안에 있는 파일과 폴더를 모두 GitHub 저장소 최상위에 올립니다. ZIP 파일 자체를 올리지 마세요.

## 2. Cloudflare 리소스

1. D1 데이터베이스 `onmamdahae-db`를 만듭니다.
2. R2 Standard 버킷 `onmamdahae-files`를 만듭니다.
3. D1 화면에서 Database ID를 복사합니다.

## 3. Workers Builds 설정

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build`
- Deploy command: `npm run deploy:built`

Build variables:

- `D1_DATABASE_NAME` = `onmamdahae-db`
- `D1_DATABASE_ID` = 위에서 복사한 D1 Database ID
- `R2_BUCKET_NAME` = `onmamdahae-files`

Worker의 Variables and Secrets에는 아래 값을 **Secret**으로 등록합니다.

- `ADMIN_PASSWORD`
- `LEADER_PASSWORD`
- `SESSION_SECRET` = 길고 무작위인 문자열(32자 이상)

첫 접속 시 필요한 D1 테이블은 앱이 자동으로 생성합니다. 일반 방문자는 팀원으로 접속하고 관리자·인도자 로그인 상태는 서명된 보안 쿠키에 30일간 유지됩니다. 비밀번호는 브라우저나 GitHub에 저장되지 않습니다.
