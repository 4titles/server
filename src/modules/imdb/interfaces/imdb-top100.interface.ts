import { TitleType } from 'src/entities/title.entity'

export interface ITitle {
    id: string
    title: string
    imdbid: string
    type: TitleType
    rank: number
    big_image: string
    description: string
    image: string
    genre: string[]
    thumbnail: string
    rating: number
    year: string
    imdb_link: string
}

export type IMDBTop100Response = ITitle[]
