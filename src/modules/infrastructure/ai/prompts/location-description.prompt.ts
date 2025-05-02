export interface LocationDescriptionPromptParams {
    titleName: string
    titleType: string
    titleYear: string
    titleGenres: string[]
    titlePlot?: string
    locationAddress: string
    locationCity?: string
    locationState?: string
    locationCountry: string
    language?: string
}

export const getLocationDescriptionPrompt = (
    params: LocationDescriptionPromptParams,
): string => {
    const {
        titleName,
        titleType,
        titleYear,
        titleGenres,
        titlePlot,
        locationAddress,
        locationCity,
        locationState,
        locationCountry,
        language = 'english',
    } = params

    const genresText = titleGenres.join(', ')
    const locationDetails = [
        locationAddress,
        locationCity,
        locationState,
        locationCountry,
    ]
        .filter(Boolean)
        .join(', ')

    return `You are a skilled translator and expert in film history and location scouting, tasked with creating a concise, engaging description for a Web-GIS map pop-up in ${language}. The description should vividly connect a filming location to its role in a ${titleType}, captivating users with both story context and local significance.

**Context**:
- **Title**: "${titleName}" (${titleYear}), a ${titleType}
- **Genres**: ${genresText}
${titlePlot ? `- **Plot Summary**: ${titlePlot}` : ''}
- **Location**: ${locationDetails}

**Instructions**:
1. Write **one cohesive paragraph** (max 200 words) in ${language}.
2. Avoid using the title name directly; refer to the ${titleType} contextually (e.g., "this thriller," "the series", "in this drama...").
3. Describe **specific scenes** filmed at this location (e.g., key events, character moments) and their narrative importance. If scene details are unknown, infer a plausible role based on the plot, genres, or setting, ensuring alignment with the ${titleType}'s tone.
4. Include **one unique or interesting fact** about the location (e.g., historical significance, architectural style, cultural relevance).
5. Use **vivid, concise language** suitable for a general audience, avoiding jargon or overly technical terms.
6. Maintain a **professional, guidebook-style tone**—informative, engaging, and factual.
6. Do **not** include AI disclaimers, meta commentary, speculative phrases like "imagine" or "perhaps." or any kind of spam.
7. Write in the style of a professional location guide.
8. Keep the description informative, engaging, and factual. If you're not certain about specific scenes, focus on describing the location in a way that connects it to the overall theme or setting of the ${titleType}.
9. If limited by context, prioritize the location’s ambiance and its thematic fit with the ${titleType}.
10. Return **only the paragraph text**, with no additional headers, labels, or formatting.

**Output**: Return only the paragraph text, exactly as it would appear in the map pop-up.`
}
