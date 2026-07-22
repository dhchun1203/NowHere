# 프로젝트 개요

현재 위치를 기반으로 주변 가게(맛집, 편의점, 백화점, 카페 등)를 카테고리별로 검색하고,
지도와 리스트로 보여주는 앱이다.

**핵심 차별점**: 사용자가 카테고리를 선택하면 앱이 특정 가게 하나를 추천하고,
그 이유를 아래 두 근거를 조합해 구체적으로 설명한다.

1. **리뷰 텍스트 요약 기반** — 예: "리뷰에서 '웨이팅 적다'는 언급이 많아요"
2. **상황 맥락 기반** — 예: "지금 시간대엔 한산해요", "비 오는 날엔 실내 좌석 많은 이곳이 좋아요"

두 근거가 겹칠 때 추천 우선순위를 높인다. 단순 별점/거리순 정렬이 아니라
"왜 지금 나에게 이 가게인지"를 설명하는 것이 이 앱의 정체성이다.

---

## 타겟 및 개발 방향

- **플랫폼**: iOS / Android 크로스플랫폼
- **개발자 배경**: 프로그래밍 경험 있음, 앱 개발은 처음
- **우선순위**: 빠른 MVP 출시 속도 (확장성/네이티브 완성도보다 속도 우선)

---

## 기술 스택

- **프레임워크**: React Native + Expo (Expo Go로 즉시 테스트 가능, 네이티브 빌드 설정 부담 최소화)
- **라우팅**: expo-router (파일 기반 라우팅 — 폴더 구조가 곧 화면 흐름)
- **위치**: expo-location
- **지도**: 카카오맵 SDK 권장 (구글맵보다 국내 가게 리뷰/영업시간 데이터 풍부).
  공식 RN 라이브러리 지원이 약하면 카카오맵 JS SDK를 웹뷰로 감싸는 방식도 고려
- **서버 상태 관리**: @tanstack/react-query (추천 API 호출, 캐싱, 로딩 상태 관리)
- **백엔드**: 미정 — Node.js(Express/Nest) 직접 구축 또는 Supabase(PostgreSQL + 인증 + 실시간)로
  MVP 속도 우선 시 Supabase 권장

### 프로젝트 폴더 구조

```
my-nearby-app/
├── app/                      # expo-router 기반 화면 (파일 = 라우트)
│   ├── index.tsx              # 온보딩 / 카테고리 선택 화면
│   ├── map/[category].tsx     # 지도+리스트 화면
│   ├── store/[id].tsx         # 가게 상세 화면
│   └── _layout.tsx            # 네비게이션 레이아웃
├── components/
│   ├── CategoryGrid.tsx
│   ├── StoreListItem.tsx
│   ├── RecommendationCard.tsx
│   └── MapMarker.tsx
├── hooks/
│   ├── useLocation.ts         # GPS 위치 훅 (권한 상태 포함)
│   └── useNearbyStores.ts     # API 호출 훅
├── services/
│   ├── api.ts                 # 백엔드 API 클라이언트
│   └── types.ts               # TypeScript 타입 정의
├── constants/
│   └── categories.ts
└── app.json
```

---

## 사용자 플로우

```
스플래시 화면 (로고, 1초 이내)
  ↓
가치 제안 슬라이드 1~2장 (스킵 버튼 항상 노출)
  ↓
위치 권한 설명 화면 → [허용하기] 버튼
  ↓
시스템 GPS 권한 팝업
  ↓
├─ 허용 → 카테고리 선택 화면
└─ 거부 → 수동 위치 검색 화면
  ↓
카테고리 선택 (맛집/편의점/백화점/카페 등)
  ↓
지도 + 리스트 화면 (주변 가게 표시)
  ↓
추천 카드 확인 (리뷰 요약 + 실시간 맥락 이유)
  ↓
가게 상세 보기
```

### 온보딩 설계 원칙

- 튜토리얼은 최대 2장. 핵심 가치("주변에서 지금 가장 좋은 곳을 이유와 함께 추천")만 전달
- 위치 권한은 시스템 팝업을 바로 띄우지 않고, **선행 설명 화면**을 먼저 보여준 뒤
  사용자가 "허용하기"를 눌렀을 때 시스템 팝업 호출 (거부 시 재요청이 어려운 OS 특성 때문)

### 위치 권한 거부 처리

권한을 거부해도 앱 사용이 막히면 안 된다.

1. **즉시 대응**: 수동 지역 검색 화면으로 전환 (동/지역명 입력 → 지역 중심 좌표로 근사 처리해
   동일한 추천 로직에 사용)
2. **재요청 유도**: 시스템 팝업은 재호출 불가하므로, 카테고리 화면 상단에 은은한 배너
   ("위치를 켜면 더 정확한 추천을 받을 수 있어요 [설정으로 이동]") 노출.
   클릭 시 `Linking.openSettings()`로 설정 앱 이동
3. **자동 전환**: `AppState`가 'active'로 바뀔 때마다 권한 상태 재확인.
   설정에서 권한을 켜고 돌아오면 앱 재시작 없이 자동으로 GPS 모드 전환

---

## 백엔드 데이터 구조

### stores (가게 기본 정보)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | 가게 고유 ID |
| name | VARCHAR | 가게명 |
| category | ENUM | 맛집/편의점/백화점/카페 등 |
| latitude, longitude | DECIMAL | 위치 좌표 |
| address | VARCHAR | 주소 |
| business_hours | JSON | 요일별 영업시간 |
| phone | VARCHAR | 전화번호 |
| avg_rating | DECIMAL | 평균 평점 |
| review_count | INT | 리뷰 수 |
| tags | ARRAY | "혼밥가능", "주차가능" 등 |
| updated_at | TIMESTAMP | 최근 갱신 시각 |

### review_summaries (리뷰 요약 — 배치로 주기 갱신, LLM으로 생성)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | |
| store_id | UUID (FK → stores) | |
| attribute | VARCHAR | "웨이팅_적음", "혼밥가능", "양많음" 등 |
| mention_ratio | DECIMAL | 전체 리뷰 중 언급 비율 (0~1) |
| sentiment | ENUM | positive / negative / neutral |
| sample_phrase | TEXT | 대표 문구 (LLM 생성 요약, 원문 그대로 저장 X) |
| generated_at | TIMESTAMP | 요약 생성 시각 |

`mention_ratio`가 핵심 필드. "언급 비율 30% 이상인 속성만 추천 근거로 채택" 같은
임계값 로직에 사용.

### context_signals (상황 맥락 — 실시간/주기적 갱신)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | |
| store_id | UUID (FK) | |
| signal_type | ENUM | busy_time / weather_fit / weekday_pattern |
| condition | JSON | 예: `{"hour_range": [14,17], "day_type": "weekday"}` |
| description | VARCHAR | "이 시간대엔 한산해요" |
| confidence | DECIMAL | 신뢰도 (데이터 수 기반) |

### recommendations (추천 결과 캐싱)

동일 카테고리+위치+시간대 조합의 추천 결과를 캐싱해 응답 속도 개선.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID (PK) | |
| store_id | UUID (FK) | |
| reason_text | TEXT | 최종 조합된 추천 문구 |
| reason_sources | JSON | `["review_summary:웨이팅_적음", "context:busy_time"]` — 근거 추적용 |
| generated_at | TIMESTAMP | |
| expires_at | TIMESTAMP | 캐시 만료 시각 |

### users / user_locations (MVP 이후 개인화 확장 시 — 초기엔 생략 가능)

| 컬럼 | 타입 |
|---|---|
| id | UUID (PK) |
| device_id | VARCHAR (익명 식별자로 시작 권장) |
| preferred_tags | ARRAY |

---

## 추천 로직 (의사코드)

```
1. 사용자가 카테고리 선택 + 현재 위치 전달
2. stores 테이블에서 반경 내 가게 조회 (category, lat/lng 기반)
3. 각 가게에 대해:
   - review_summaries에서 mention_ratio 상위 속성 조회
   - context_signals에서 현재 시간/날씨와 매칭되는 조건 조회
   - 두 조건이 겹치면 가중치 상승
4. 가중치 최상위 1곳을 추천 + reason_text 조합
5. recommendations 테이블에 캐싱 (동일 조건 재요청 시 재사용)
```

---

## MVP 범위 (1차 출시 목표)

우선순위가 낮은 항목은 2차 버전으로 미룬다.

- [x] 카테고리 기반 주변 가게 검색 (지도 + 리스트)
- [x] 가게 상세 정보 (영업시간, 태그, 사진)
- [x] 리뷰 요약 기반 추천 이유 (배치 처리, 하루 1회 갱신)
- [x] 상황 맥락: 날씨 + 시간대 정도만 우선 반영
- [ ] 실시간 혼잡도(웨이팅) 데이터 — 2차 버전
- [ ] 사용자 개인화 추천 (방문 이력 기반) — 2차 버전 이후

---

## 화면 목록 (구현 순서)

1. 온보딩 (가치 제안 슬라이드 + 위치 권한 요청)
2. 카테고리 선택 화면
3. 지도 + 리스트 화면
4. 추천 카드 (핵심 차별점 — 리뷰 요약 + 맥락 이유 조합 문구 표시)
5. 가게 상세 화면
6. 수동 위치 검색 화면 (권한 거부 시 폴백)

---

## 참고: 왜 이 구조인가

- React Native + Expo를 택한 이유: 프로그래밍 경험은 있지만 앱 개발이 처음이므로
  네이티브 빌드 세팅 부담 없이 빠르게 MVP를 낼 수 있는 조합
- 리뷰 요약과 상황 맥락을 분리된 테이블로 둔 이유: 리뷰 요약은 배치(하루 1회)로,
  맥락 신호는 더 자주(또는 실시간) 갱신되어야 하므로 갱신 주기가 다른 데이터를
  분리해야 캐싱/성능 관리가 쉬움
- `reason_sources`를 JSON으로 별도 저장하는 이유: 추천 문구가 어떤 근거들의 조합인지
  추적 가능해야 나중에 로직 튜닝이나 A/B 테스트가 가능함
