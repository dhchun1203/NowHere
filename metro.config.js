const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js -> @supabase/realtime-js -> ws 가 Metro의 최신 package.json
// "exports" 해석 방식과 충돌해 "Unable to resolve module ./lib/serializer" 등의
// 에러를 내는 알려진 이슈. exports 해석을 끄면 기존 방식(main 필드)으로 해석해 우회된다.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
