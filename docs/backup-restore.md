# Neverland 백업과 복구

## 백업 대상

- PostgreSQL: 문서, 사용자, 컬렉션과 Outline 메타데이터
- Outline file storage: 업로드한 이미지와 첨부파일
- Git 저장소: Compose, Caddy, Dex, 블로그 코드와 설정 예시

실제 비밀값이 있는 `.env`는 백업 파일에 넣지 않는다. 운영 환경의 비밀 저장소나 암호화된 별도 위치에서 관리한다.

## 백업 실행

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

기본 보관 위치는 `backups/YYYYMMDD-HHMMSS`이고 14일이 지난 백업은 제거한다.

```bash
BACKUP_DIR=/safe/neverland BACKUP_RETENTION_DAYS=30 ./scripts/backup.sh
```

각 백업에는 다음 파일이 생성된다.

- `postgres.sql.gz`
- `outline-data.tar.gz`
- `SHA256SUMS`

## 무결성 확인

```bash
cd backups/YYYYMMDD-HHMMSS
../../scripts/verify-backup.sh "$PWD"
```

## 복구

새 환경에 같은 버전의 서비스를 먼저 구성하고 중지한다.

```bash
docker compose up -d postgres redis
gunzip -c backups/YYYYMMDD-HHMMSS/postgres.sql.gz \
  | docker compose exec -T postgres psql -U outline -d outline
```

첨부파일은 임시 디렉터리에 푼 뒤 Outline 컨테이너로 복사한다.

```bash
mkdir -p /tmp/neverland-outline-restore
tar -xzf backups/YYYYMMDD-HHMMSS/outline-data.tar.gz -C /tmp/neverland-outline-restore
docker compose cp /tmp/neverland-outline-restore/outline-data/. outline:/var/lib/outline/data
docker compose up -d
```

복구 후 로그인, 문서 본문, 이미지와 첨부파일, `/writing`, `/projects`를 확인한다.
