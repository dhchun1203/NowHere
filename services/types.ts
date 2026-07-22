export type Category = "맛집" | "편의점" | "백화점" | "카페";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type BusinessHours = {
  [day in "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"]?: {
    open: string;
    close: string;
  };
};

export type Store = {
  id: string;
  name: string;
  category: Category;
  latitude: number;
  longitude: number;
  address: string;
  businessHours: BusinessHours;
  phone: string;
  avgRating: number;
  reviewCount: number;
  tags: string[];
  updatedAt: string;
  kakaoPlaceUrl: string | null;
};

export type Sentiment = "positive" | "negative" | "neutral";

export type ReviewSummary = {
  id: string;
  storeId: string;
  attribute: string;
  mentionRatio: number;
  sentiment: Sentiment;
  samplePhrase: string;
  generatedAt: string;
};

export type SignalType = "busy_time" | "weather_fit" | "weekday_pattern";

export type ContextSignal = {
  id: string;
  storeId: string;
  signalType: SignalType;
  condition: {
    hourRange?: [number, number];
    dayType?: "weekday" | "weekend";
    weather?: "rain" | "clear" | "snow";
  };
  description: string;
  confidence: number;
};

export type ReasonSource = `review_summary:${string}` | `context:${SignalType}`;

export type Recommendation = {
  store: Store;
  reasonText: string;
  reasonSources: ReasonSource[];
  generatedAt: string;
  expiresAt: string;
};

export type StoreWithDistance = Store & {
  distanceMeters: number;
};
