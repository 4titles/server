import { TitleType } from 'src/entities/title.entity'

export interface ITitle {
    rank: number
    title: string
    description: string
    image: string
    big_image: string
    genre: string[]
    thumbnail: string
    rating: number
    id: string
    year: string
    imdbid: string
    imdb_link: string
    type: TitleType
}

export type IMDBTop100Response = ITitle[]
