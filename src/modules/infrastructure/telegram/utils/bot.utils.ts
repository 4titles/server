interface Milestone {
    threshold: number
    emoji: string
    message?: string
}

const FOLLOWER_EMOJI_MILESTONES: Milestone[] = [
    { threshold: 0, emoji: '😊' },
    { threshold: 10, emoji: '🌱' },
    { threshold: 50, emoji: '🌿' },
    { threshold: 100, emoji: '🌲' },
    { threshold: 500, emoji: '🔥' },
    { threshold: 1000, emoji: '⭐' },
    { threshold: 5000, emoji: '🌟' },
    { threshold: 10000, emoji: '💫' },
    { threshold: 50000, emoji: '🚀' },
    { threshold: Infinity, emoji: '🌠' },
]

const FOLLOWER_MESSAGE_MILESTONES: Milestone[] = [
    {
        threshold: 1,
        emoji: '🎉',
        message:
            '🎉 Первый подписчик! Теперь они будут видеть все локации, которые вы добавляете.',
    },
    {
        threshold: 10,
        emoji: '🚀',
        message: '🚀 10 подписчиков! Ваши находки интересны сообществу.',
    },
    {
        threshold: 50,
        emoji: '🏆',
        message: '🏆 50 подписчиков! Вы стали авторитетом в мире кинолокаций.',
    },
    {
        threshold: 100,
        emoji: '🎬',
        message:
            '🎬 100 подписчиков! Целая киноэкспедиция следит за вашими открытиями.',
    },
]

export function getFollowersEmoji(count: number): string {
    for (const milestone of FOLLOWER_EMOJI_MILESTONES) {
        if (count < milestone.threshold) continue
        if (
            count <
            (FOLLOWER_EMOJI_MILESTONES[
                FOLLOWER_EMOJI_MILESTONES.indexOf(milestone) + 1
            ]?.threshold || Infinity)
        )
            return milestone.emoji
    }
    return FOLLOWER_EMOJI_MILESTONES[FOLLOWER_EMOJI_MILESTONES.length - 1].emoji
}

export function getFollowerMilestoneMessage(count: number): string {
    const milestone = FOLLOWER_MESSAGE_MILESTONES.find(
        (m) => count === m.threshold,
    )
    return (
        milestone?.message ||
        'Ваши кинолокации привлекают внимание! Продолжайте исследовать!'
    )
}
