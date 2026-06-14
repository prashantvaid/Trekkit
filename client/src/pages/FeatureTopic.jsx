import TopicPage from "../components/info/TopicPage.jsx";
import { FEATURE_TOPICS, FEATURE_ORDER } from "../components/info/topics.js";

export default function FeatureTopic() {
  return (
    <TopicPage
      topics={FEATURE_TOPICS}
      order={FEATURE_ORDER}
      basePath="/features"
      overviewLabel="All features"
      dense
    />
  );
}
