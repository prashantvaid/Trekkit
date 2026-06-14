import TopicIndex from "../components/info/TopicIndex.jsx";
import { FEATURE_TOPICS, FEATURE_ORDER } from "../components/info/topics.js";

export default function Features() {
  return (
    <TopicIndex
      badge="✨ Features"
      title="Built for travelers who think in maps"
      lead="A travel diary, trip planner, and social feed — every tool ties back to real places."
      intro="Trekkit isn't a checklist app with a map widget. The map is the product: pins, photos, routes, and friends' trips all live on the same coordinates. Pick a feature below to see how it works in detail."
      topics={FEATURE_TOPICS}
      order={FEATURE_ORDER}
      basePath="/features"
      rich
      ctaTitle="Map your next trip"
      ctaLabel="Create free account"
    />
  );
}
