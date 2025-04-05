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

    return `You are an expert in films, series, and their filming locations.

I need you to create a descriptive paragraph about a filming location from "${titleName}" (${titleYear}), which is a ${titleType} in these genres: ${genresText}.

${titlePlot ? `The plot summary: ${titlePlot}` : ''}

The filming location address is: ${locationDetails}

Please write a descriptive paragraph (maximum 250 words) in ${language} that:
1. Explains where and how this location appeared in the ${titleType}
2. Describes what scenes might have been filmed there
3. Provides interesting information about the location itself
4. Explains why this location might have been chosen for filming

Keep the description informative, engaging, and factual. If you're not certain about specific scenes, focus on describing the location in a way that connects it to the overall theme or setting of the ${titleType}.

Do not include phrases like "I don't have specific information about" or "Without specific details" or any disclaimers. Just provide the most plausible description based on the available information. Write in the style of a professional location guide.

Reply only with the descriptive paragraph, without any additional text.`
}
