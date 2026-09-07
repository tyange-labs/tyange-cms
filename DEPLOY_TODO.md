# Deploy / 인프라 정리 TODO

CMS 접근 제한을 nginx basic auth → Tailscale로 옮기면서(2026-09, `CLAUDE.md`의
`## 로그인 > 접근 제한 (Tailscale)` 참고) 남은 뒷정리 항목. 기능에는 영향 없고,
방치해도 동작하지만 지저분한 것들.

## Lightsail 박스 (`ssh ubuntu@100.96.219.103`, Tailscale SSH)

- [ ] `sudo certbot delete --cert-name cms.tyange.com`
  - vhost를 내려서 HTTP-01 갱신이 실패한다 → Let's Encrypt 만료 경고 메일이 옴.
  - `cms.tyange.com` 전용 인증서라 삭제 안전 (blog와 SAN 공유 아님 — 확인함).
- [ ] `/etc/nginx/.htpasswd` 삭제 — basic auth 없어져서 미사용.
- [ ] `/etc/nginx/sites-available/cms.tyange.com` + `~/cms.tyange.com.nginx.*.bak` 삭제
  - 롤백 계획이 없으면. (롤백 방법은 `CLAUDE.md` 해당 절에 적어둠.)

## DNS

- [ ] `cms.tyange.com` A 레코드 삭제
  - 지금 `52.78.251.17`을 가리키지만 그 IP엔 이제 CMS vhost가 없다 (기본 서버로 빠져
    인증서 불일치). 접근은 `https://cms.tail7710bc.ts.net` (tailnet 전용)로만.

## tyange-cms-api (별도 저장소)

- [ ] Forgejo 저장소 Settings → Secrets에서 `JWT_REFRESH_SECRET` 삭제
  - refresh token 제거(2026-09)로 미사용. 코드·`.forgejo/workflows/deploy.yml`에선 이미 뺐다.
- [ ] `src/main.rs` CORS 목록에서 `https://cms.tyange.com` 제거
  - 미사용(브라우저는 Nuxt 서버 라우트하고만 통신). 무해해서 방치 중 — 다음 cms-api 작업 때.
- [ ] `USER_AUTH_TODO.md`의 "Add refresh-token flow / `POST /refresh`" 항목 폐기
  - Tailscale + 1년 access token으로 방향을 바꿔 refresh token 자체를 걷어냈다.
