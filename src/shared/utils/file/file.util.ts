import { ReadStream } from 'fs'
import { Readable } from 'stream'

export function validateFileFormat(
    filename: string,
    allowedFileFormats: string[],
) {
    const fileParts = filename.split('.')
    const extension = fileParts[fileParts.length - 1]

    return allowedFileFormats.includes(extension)
}

export async function validateFileSize(
    fileStream: ReadStream,
    allowedFileSizeInBytes: number,
) {
    return new Promise((resolve, reject) => {
        let fileSizeInBytes = 0

        fileStream
            .on('data', (data: Buffer) => {
                fileSizeInBytes = data.byteLength
            })
            .on('end', () => {
                resolve(fileSizeInBytes <= allowedFileSizeInBytes)
            })
            .on('error', (error) => {
                reject(error)
            })
    })
}

export async function readStreamWithSizeValidation(
    stream: Readable,
    maxSizeinMB: number,
): Promise<Buffer> {
    const chunks: Buffer[] = []
    let fileSize = 0

    for await (const chunk of stream) {
        fileSize += chunk.length
        if (fileSize > maxSizeinMB) {
            throw new Error(
                `The file size exceeds ${maxSizeinMB / (1024 * 1024)} MB`,
            )
        }
        chunks.push(chunk)
    }
    return Buffer.concat(chunks)
}
