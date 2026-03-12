// src/backend/utils/fillLcProblems.js
import { LeetCode } from "leetcode-query";
import lc_problems from "../models/submissions/lc_problems.js";

async function fillLcProblems(leetcode, submission) {
    const existingProblem = await lc_problems.findOne({ titleSlug: submission.titleSlug });
    if (existingProblem) {
        return {
            success: true,
            difficulty: existingProblem.difficulty
        };
    }
    const { difficulty, topicTags } = await leetcode.problem(submission.titleSlug);
    await lc_problems.findOneAndUpdate(
        { titleSlug: submission.titleSlug },
        {
            $setOnInsert: {
                titleSlug: submission.titleSlug,
                title: submission.title,
                difficulty,
                topicTags,
            }
        },
        { upsert: true, returnDocument: 'after' }
    );
    return {
        difficulty
    }
}

export { fillLcProblems };