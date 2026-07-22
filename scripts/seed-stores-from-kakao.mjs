// 서울 주요 권역의 실제 가게를 카카오 로컬 API로 가져와 stores 테이블에 채운다.
// 평점/영업시간은 카카오 API가 제공하지 않아 0/빈 값으로 두고, 대신 kakao_place_url을
// 저장해서 앱에서 "카카오맵에서 보기" 버튼으로 실제 정보를 보여준다.
//
// 실행: node --env-file=.env scripts/seed-stores-from-kakao.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

for (const [name, value] of Object.entries({
  EXPO_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  EXPO_PUBLIC_KAKAO_REST_API_KEY: KAKAO_REST_API_KEY,
})) {
  if (!value) {
    console.error(`환경변수 ${name}가 없어요. .env에 추가하고 다시 실행하세요.`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const AREAS = [
  { label: "강남역", latitude: 37.4979, longitude: 127.0276 },
  { label: "홍대입구", latitude: 37.5563, longitude: 126.9236 },
  { label: "이태원", latitude: 37.5344, longitude: 126.9944 },
  { label: "잠실", latitude: 37.5133, longitude: 127.1001 },
  { label: "신촌", latitude: 37.5559, longitude: 126.9368 },
  { label: "여의도", latitude: 37.5219, longitude: 126.9245 },
  { label: "종로", latitude: 37.5704, longitude: 126.9831 },
];

const RADIUS_METERS = 3000;
const PER_AREA_LIMIT = 5;

async function kakaoCategorySearch(categoryCode, area) {
  const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${categoryCode}&x=${area.longitude}&y=${area.latitude}&radius=${RADIUS_METERS}&sort=accuracy&size=15`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } });
  if (!res.ok) {
    console.warn(`  카테고리 검색 실패 (HTTP ${res.status}): ${area.label} / ${categoryCode}`);
    return [];
  }
  const data = await res.json();
  return data.documents ?? [];
}

async function kakaoKeywordSearch(query, area) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${area.longitude}&y=${area.latitude}&radius=${RADIUS_METERS}&sort=accuracy&size=15`;
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } });
  if (!res.ok) {
    console.warn(`  키워드 검색 실패 (HTTP ${res.status}): ${area.label} / ${query}`);
    return [];
  }
  const data = await res.json();
  return data.documents ?? [];
}

function toStoreRow(doc, category) {
  return {
    name: doc.place_name,
    category,
    latitude: Number(doc.y),
    longitude: Number(doc.x),
    address: doc.road_address_name || doc.address_name,
    business_hours: {},
    phone: doc.phone || null,
    avg_rating: 0,
    review_count: 0,
    tags: [],
    kakao_place_url: doc.place_url,
    updated_at: new Date().toISOString(),
  };
}

const CATEGORY_JOBS = [
  { category: "맛집", search: (area) => kakaoCategorySearch("FD6", area) },
  { category: "카페", search: (area) => kakaoCategorySearch("CE7", area) },
  { category: "편의점", search: (area) => kakaoCategorySearch("CS2", area) },
  { category: "백화점", search: (area) => kakaoKeywordSearch("백화점", area) },
];

async function main() {
  const seenPlaceUrls = new Set();
  let totalInserted = 0;

  for (const area of AREAS) {
    console.log(`\n=== ${area.label} ===`);
    for (const job of CATEGORY_JOBS) {
      const docs = await job.search(area);
      const rows = [];
      for (const doc of docs.slice(0, PER_AREA_LIMIT)) {
        if (seenPlaceUrls.has(doc.place_url)) continue;
        seenPlaceUrls.add(doc.place_url);
        rows.push(toStoreRow(doc, job.category));
      }
      if (rows.length === 0) {
        console.log(`  ${job.category}: 새로 추가할 가게 없음`);
        continue;
      }
      const { error } = await supabase
        .from("stores")
        .upsert(rows, { onConflict: "kakao_place_url" });
      if (error) {
        console.error(`  ${job.category} 저장 실패: ${error.message}`);
        continue;
      }
      console.log(`  ${job.category}: ${rows.length}개 저장 (${rows.map((r) => r.name).join(", ")})`);
      totalInserted += rows.length;
    }
  }

  console.log(`\n완료. 총 ${totalInserted}개 가게 저장/갱신.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
