import 'moviedb-promise'

declare module 'moviedb-promise' {
    export interface Country {
        native_name?: string
    }

    export interface TmdbCountry {
        english_name?: string
        iso_3166_1?: string
        native_name?: string
    }
}
