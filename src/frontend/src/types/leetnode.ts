// types/leetnode.ts
export type Difficulty = "All" | "Easy" | "Medium" | "Hard";

export type AllQuestionsCountItem = {
  difficulty: Difficulty;
  count: number;
};

export type Contributions = {
  points: number;
  questionCount: number;
  testcaseCount: number;
};

export type Profile = {
  realName: string;
  websites: string[];
  countryName: string | null;
  skillTags: string[];
  company: string | null;
  school: string | null;
  starRating: number;
  aboutMe: string;
  userAvatar: string;
  reputation: number;
  ranking: number;
};

export type SubmissionNumItem = {
  difficulty: Difficulty;
  count: number; // accepted count (for acSubmissionNum) or total count (for totalSubmissionNum)
  submissions: number; // accepted submissions or total submissions
};

export type SubmitStats = {
  acSubmissionNum: SubmissionNumItem[];
  totalSubmissionNum: SubmissionNumItem[];
};

export type Badge = {
  id: string;
  displayName: string;
  icon: string;
  creationDate: string; // YYYY-MM-DD
};

export type UpcomingBadge = {
  name: string;
  icon: string; // relative or absolute
};

export type ActiveBadge = {
  id: string;
};

export type MatchedUser = {
  username: string;
  socialAccounts: unknown[] | null; // can be null
  githubUrl: string | null;
  contributions: Contributions;
  profile: Profile;
  submissionCalendar: string; // JSON string mapping unix -> count
  submitStats: SubmitStats;
  badges: Badge[];
  upcomingBadges: UpcomingBadge[];
  activeBadge: ActiveBadge | null;
};

export type RecentSubmission = {
  title: string;
  titleSlug: string;
  timestamp: string; // unix seconds as string
  statusDisplay: string;
  lang: string;
};

export type LeetNodeUserPayload = {
  user: {
    allQuestionsCount: AllQuestionsCountItem[];
    matchedUser: MatchedUser;
    recentSubmissionList: RecentSubmission[];
  };
};
