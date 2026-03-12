import lc_problems from "../models/submissions/lc_problems.js";

async function fillLcProblems(leetcode, problem) {
    const existingProblem = await lc_problems.findOne({ titleSlug: problem.titleSlug });
    if (existingProblem) {
        return {
            success: false,
            difficulty: existingProblem.difficulty
        };
    }
    const { difficulty, topicTags } = await leetcode.problem(problem.titleSlug);
    await lc_problems.findOneAndUpdate(
        { titleSlug: problem.titleSlug },
        {
            $setOnInsert: {
                titleSlug: problem.titleSlug,
                title: problem.title,
                difficulty,
                topicTags,
            }
        },
        { upsert: true, returnDocument: 'after' }
    );
    return {
        success: true,
        difficulty
    }
}

export { fillLcProblems };