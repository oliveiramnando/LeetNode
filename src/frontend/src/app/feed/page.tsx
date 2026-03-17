import Container from "@/components/Container";
import SubmissionFeed from "@/components/feed/SubmissionFeed";

export default function FeedPage() {
  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Submission Feed
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          See the most recent LeetCode activity from people you follow.
        </p>
      </div>

      <SubmissionFeed />
    </Container>
  );
}