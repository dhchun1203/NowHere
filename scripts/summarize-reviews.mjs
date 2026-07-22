// 리뷰 요약 배치 스크립트 (CLAUDE.md: review_summaries는 하루 1회 배치로 갱신).
// stores 테이블의 각 가게 이름으로 네이버 블로그 검색 API를 호출해 공개 블로그 스니펫을 모으고,
// Claude에게 "원문을 그대로 인용하지 말고 새로 요약해서" 만들게 한 뒤 review_summaries에 upsert한다.
// 앱의 실시간 요청 경로와는 완전히 분리된 오프라인 스크립트라 사용자 체감 성능에 영향이 없다.
//
// 실행: node --env-file=.env scripts/summarize-reviews.mjs

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

for (const [name, value] of Object.entries({
  EXPO_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
  ANTHROPIC_API_KEY,
})) {
  if (!value) {
    console.error(`환경변수 ${name}가 없어요. .env에 추가하고 다시 실행하세요.`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

function stripHtml(text) {
  return text.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

async function searchNaverBlog(query) {
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=10&sort=sim`;
  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });
  if (!res.ok) {
    console.warn(`  네이버 검색 실패 (HTTP ${res.status}): ${query}`);
    return [];
  }
  const data = await res.json();
  return (data.items || []).map((item) => ({
    title: stripHtml(item.title),
    description: stripHtml(item.description),
  }));
}

const SYSTEM_PROMPT = `너는 한국 맛집/가게 리뷰 요약 시스템이다. 여러 블로그 글의 제목/요약 스니펫을 보고,
그 가게에 대해 사람들이 자주 언급하는 특징을 추출한다.

규칙:
- 스니펫 원문을 그대로 인용하지 말고, 반드시 너가 새로 표현을 바꿔서 요약 문구를 작성한다.
- 스니펫에서 실제로 확인되는 내용만 근거로 삼는다. 근거가 부족하면 무리해서 만들지 말고 빈 배열을 반환한다.
- 최대 4개까지만 추출한다.
- attribute는 "웨이팅_적음", "혼밥가능", "가성비", "분위기좋음" 같은 짧은 한국어 키워드로 작성한다.
- mentionRatio는 0~1 사이 숫자로, 제공된 스니펫 중 몇 개가 해당 특징을 언급하는지 비율로 추정한다.
- sentiment는 positive, negative, neutral 중 하나다.
- samplePhrase는 20자 내외의 자연스러운 한국어 문장으로, 절대 원문 그대로 베끼지 않는다.

반드시 JSON 배열만 응답한다. 마크다운 코드블록(\`\`\`)으로 감싸지 말고, 다른 설명 텍스트도 붙이지 않는다. 형식:
[{"attribute": "...", "mentionRatio": 0.4, "sentiment": "positive", "samplePhrase": "..."}]`;

async function summarizeWithClaude(storeName, snippets) {
  const snippetText = snippets
    .map((s, i) => `${i + 1}. ${s.title} - ${s.description}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `가게 이름: ${storeName}\n\n블로그 스니펫:\n${snippetText}`,
      },
    ],
  });

  const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
  // 가끔 마크다운 코드블록으로 감싸서 응답하는 경우가 있어 방어적으로 벗겨낸다.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`  Claude 응답 파싱 실패: ${text.slice(0, 300)}`);
    return [];
  }
}

function isAnthropicAuthError(err) {
  return err instanceof Anthropic.APIError && err.status === 401;
}

function isInsufficientCreditsError(err) {
  return err instanceof Anthropic.APIError && err.status === 400 && /credit balance/i.test(err.message);
}

async function main() {
  const { data: stores, error } = await supabase.from("stores").select("id, name, address");
  if (error) throw error;

  console.log(`${stores.length}개 가게에 대해 리뷰 요약을 생성합니다.\n`);

  let totalWritten = 0;

  for (const store of stores) {
    console.log(`- ${store.name}`);
    const snippets = await searchNaverBlog(`${store.name} 후기`);
    if (snippets.length === 0) {
      console.log("  블로그 스니펫 없음, 건너뜀");
      continue;
    }

    let attributes;
    try {
      attributes = await summarizeWithClaude(store.name, snippets);
    } catch (err) {
      if (isAnthropicAuthError(err)) {
        console.error(
          "\nAnthropic API 키가 만료되었거나 유효하지 않습니다 (401 Unauthorized).\n" +
            "console.anthropic.com에서 새 키를 발급받아 .env의 ANTHROPIC_API_KEY를 갱신한 뒤 다시 실행하세요."
        );
        process.exit(1);
      }
      if (isInsufficientCreditsError(err)) {
        console.error(
          "\nAnthropic 계정 크레딧이 부족합니다.\n" +
            "console.anthropic.com/settings/billing 에서 크레딧을 충전한 뒤 다시 실행하세요."
        );
        process.exit(1);
      }
      throw err;
    }
    if (attributes.length === 0) {
      console.log("  근거 부족으로 요약 생성 안 함");
      continue;
    }

    const rows = attributes.map((a) => ({
      store_id: store.id,
      attribute: a.attribute,
      mention_ratio: a.mentionRatio,
      sentiment: a.sentiment,
      sample_phrase: a.samplePhrase,
      generated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("review_summaries")
      .upsert(rows, { onConflict: "store_id,attribute" });
    if (upsertError) {
      console.error(`  저장 실패: ${upsertError.message}`);
      continue;
    }

    console.log(`  ${rows.length}개 속성 저장됨: ${rows.map((r) => r.attribute).join(", ")}`);
    totalWritten += rows.length;
  }

  console.log(`\n완료. 총 ${totalWritten}개 review_summaries row 작성/갱신.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
