-- storefinder MVP 스키마 + 시드 데이터 (CLAUDE.md 백엔드 데이터 구조 기준)
-- Supabase 대시보드 > SQL Editor 에서 전체를 한 번에 실행하세요.

create extension if not exists pgcrypto;

do $$ begin
  create type store_category as enum ('맛집', '편의점', '백화점', '카페');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_sentiment as enum ('positive', 'negative', 'neutral');
exception when duplicate_object then null; end $$;

do $$ begin
  create type context_signal_type as enum ('busy_time', 'weather_fit', 'weekday_pattern');
exception when duplicate_object then null; end $$;

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category store_category not null,
  latitude numeric not null,
  longitude numeric not null,
  address text not null,
  business_hours jsonb not null default '{}'::jsonb,
  phone text,
  avg_rating numeric not null default 0,
  review_count integer not null default 0,
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists review_summaries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  attribute text not null,
  mention_ratio numeric not null check (mention_ratio >= 0 and mention_ratio <= 1),
  sentiment review_sentiment not null,
  sample_phrase text not null,
  generated_at timestamptz not null default now(),
  unique (store_id, attribute)
);

create table if not exists context_signals (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  signal_type context_signal_type not null,
  condition jsonb not null default '{}'::jsonb,
  description text not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  unique (store_id, signal_type, description)
);

-- 이 스크립트를 이전 버전으로 이미 한 번 실행한 프로젝트는 review_summaries/context_signals
-- 테이블이 위 unique 제약 없이 이미 생성돼있어 "create table if not exists"가 그냥 스킵된다.
-- 기존 테이블에도 제약을 소급 적용한다.
do $$ begin
  alter table review_summaries add constraint review_summaries_store_id_attribute_key unique (store_id, attribute);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table context_signals add constraint context_signals_store_id_signal_type_description_key unique (store_id, signal_type, description);
exception when duplicate_object then null; end $$;

-- 추천 결과 캐싱용 테이블. 이번 단계에서는 클라이언트가 아직 쓰지 않고(인메모리 캐시 유지),
-- 추후 서버 사이드 캐싱으로 옮길 때 사용할 자리만 만들어둔다.
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  reason_text text not null,
  reason_sources jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table stores enable row level security;
alter table review_summaries enable row level security;
alter table context_signals enable row level security;
alter table recommendations enable row level security;

drop policy if exists "Public read access" on stores;
create policy "Public read access" on stores for select using (true);

drop policy if exists "Public read access" on review_summaries;
create policy "Public read access" on review_summaries for select using (true);

drop policy if exists "Public read access" on context_signals;
create policy "Public read access" on context_signals for select using (true);

drop policy if exists "Public read access" on recommendations;
create policy "Public read access" on recommendations for select using (true);

-- 요일별로 동일한 영업시간을 7일 전체(mon~sun)에 채워주는 헬퍼.
-- 목업 가게들은 전부 "요일 상관없이 매일 같은 시간 영업"으로 가정한다 (휴무일 데이터 없음).
create or replace function daily_hours(p_open text, p_close text) returns jsonb as $$
  select jsonb_object_agg(day, jsonb_build_object('open', p_open, 'close', p_close))
  from unnest(array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) as day;
$$ language sql immutable;

-- 시드 데이터: 강남역 주변 목업 가게 11곳 (프로토타입용 고정 UUID 사용)
insert into stores (id, name, category, latitude, longitude, address, business_hours, phone, avg_rating, review_count, tags, updated_at) values
  ('a0000000-0000-0000-0000-000000000001', '할머니 손칼국수', '맛집', 37.4991, 127.0268, '서울 강남구 테헤란로 12길 5', daily_hours('10:30', '21:00'), '02-1234-5678', 4.5, 812, array['혼밥가능', '웨이팅적음'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000002', '우진 삼겹살', '맛집', 37.4961, 127.0297, '서울 강남구 역삼로 33', daily_hours('16:00', '24:00'), '02-2345-6789', 4.3, 1560, array['주차가능', '단체가능'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000003', '정성스시', '맛집', 37.5006, 127.0291, '서울 강남구 논현로 100', daily_hours('11:30', '22:00'), '02-3456-7890', 4.7, 430, array['혼밥가능', '룸있음'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000004', '종로 김치찌개', '맛집', 37.4970, 127.0251, '서울 강남구 강남대로 50길 8', daily_hours('09:00', '20:00'), '02-4567-8901', 4.1, 980, array['가성비', '혼밥가능'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000005', '느린 오후 커피', '카페', 37.4987, 127.0287, '서울 강남구 선릉로 25길 4', daily_hours('08:00', '22:00'), '02-5678-9012', 4.6, 640, array['콘센트많음', '조용함'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000006', '브릭레인 로스터리', '카페', 37.4957, 127.0282, '서울 강남구 테헤란로 8길 15', daily_hours('07:30', '21:00'), '02-6789-0123', 4.4, 305, array['실내좌석많음', '노트북가능'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000007', '코너스톤 베이커리 카페', '카페', 37.5010, 127.0259, '서울 강남구 역삼로 61', daily_hours('08:00', '20:00'), '02-7890-1234', 4.2, 512, array['디저트맛집'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000008', 'GS25 강남역점', '편의점', 37.4985, 127.0272, '서울 강남구 강남대로 396', daily_hours('00:00', '24:00'), '02-8901-2345', 4.0, 88, array['24시간', '택배가능'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000009', 'CU 역삼점', '편의점', 37.4966, 127.0285, '서울 강남구 역삼로 44', daily_hours('00:00', '24:00'), '02-9012-3456', 3.9, 45, array['24시간', 'ATM있음'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000010', '강남 센트럴 백화점', '백화점', 37.5014, 127.0304, '서울 강남구 테헤란로 152', daily_hours('10:30', '20:00'), '02-0123-4567', 4.3, 2100, array['주차가능', '발렛가능'], '2026-07-20T09:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000011', '논현 프리미엄 아울렛', '백화점', 37.4948, 127.0257, '서울 강남구 논현로 65길 12', daily_hours('10:30', '21:00'), '02-1230-4560', 4.1, 760, array['주차가능'], '2026-07-20T09:00:00+09:00')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  address = excluded.address,
  business_hours = excluded.business_hours,
  phone = excluded.phone,
  avg_rating = excluded.avg_rating,
  review_count = excluded.review_count,
  tags = excluded.tags,
  updated_at = excluded.updated_at;

insert into review_summaries (store_id, attribute, mention_ratio, sentiment, sample_phrase, generated_at) values
  ('a0000000-0000-0000-0000-000000000001', '웨이팅_적음', 0.42, 'positive', '웨이팅 거의 없이 바로 들어갈 수 있어요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000001', '혼밥가능', 0.35, 'positive', '혼자 가도 눈치 안 보이는 분위기예요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000002', '양많음', 0.55, 'positive', '양이 정말 푸짐해요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000003', '웨이팅_적음', 0.22, 'positive', '예약하면 대기 없이 이용 가능해요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000004', '가성비', 0.48, 'positive', '가격 대비 반찬이 알차요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000005', '조용함', 0.5, 'positive', '작업하기 좋을 만큼 조용해요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000006', '실내좌석많음', 0.44, 'positive', '비 오는 날에도 앉을 자리가 많아요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000007', '디저트맛집', 0.6, 'positive', '디저트가 다 맛있다는 후기가 많아요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000008', '친절함', 0.2, 'positive', '직원분이 친절해요', '2026-07-22T00:00:00+09:00'),
  ('a0000000-0000-0000-0000-000000000010', '주차편함', 0.33, 'positive', '주차가 넉넉하고 편해요', '2026-07-22T00:00:00+09:00')
on conflict (store_id, attribute) do update set
  mention_ratio = excluded.mention_ratio,
  sentiment = excluded.sentiment,
  sample_phrase = excluded.sample_phrase,
  generated_at = excluded.generated_at;

insert into context_signals (store_id, signal_type, condition, description, confidence) values
  ('a0000000-0000-0000-0000-000000000001', 'busy_time', '{"hourRange": [14, 17], "dayType": "weekday"}', '지금 시간대엔 한산해요', 0.8),
  ('a0000000-0000-0000-0000-000000000002', 'busy_time', '{"hourRange": [18, 21]}', '저녁 시간대엔 붐빌 수 있어요', 0.6),
  ('a0000000-0000-0000-0000-000000000003', 'weather_fit', '{"weather": "rain"}', '비 오는 날엔 실내 좌석이 많은 이곳이 좋아요', 0.7),
  ('a0000000-0000-0000-0000-000000000004', 'busy_time', '{"hourRange": [11, 14]}', '점심시간엔 줄이 길 수 있어요', 0.5),
  ('a0000000-0000-0000-0000-000000000005', 'busy_time', '{"hourRange": [14, 18], "dayType": "weekday"}', '평일 오후엔 자리가 여유로워요', 0.85),
  ('a0000000-0000-0000-0000-000000000006', 'weather_fit', '{"weather": "rain"}', '비 오는 날엔 실내 좌석 많은 이곳이 좋아요', 0.75),
  ('a0000000-0000-0000-0000-000000000008', 'busy_time', '{"hourRange": [0, 24]}', '24시간 언제나 이용 가능해요', 0.9),
  ('a0000000-0000-0000-0000-000000000010', 'weekday_pattern', '{"dayType": "weekday"}', '평일엔 주차와 매장 모두 여유로워요', 0.65)
on conflict (store_id, signal_type, description) do update set
  condition = excluded.condition,
  confidence = excluded.confidence;
