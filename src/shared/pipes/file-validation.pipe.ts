import { ContentModerationService } from '@/modules/content/content-moderation/services/content-moderation.service'
import {
    BadRequestException,
    Injectable,
    type PipeTransform,
} from '@nestjs/common'
import {
    readStreamWithSizeValidation,
    validateFileFormat,
} from '../utils/file/file.util'

@Injectable()
export class FileValidationPipe implements PipeTransform {
    private readonly MAX_FILE_SIZE_IN_MB: number = 10 * 1024 * 1024

    constructor(
        private readonly contentModerationService: ContentModerationService,
    ) {}

    public async transform(value: any) {
        const upload = Array.isArray(value) ? value[0] : value

        if (!upload || !upload.file) {
            throw new BadRequestException(
                'The file has not been uploaded properly',
            )
        }

        const { filename, createReadStream } = upload.file

        if (!filename) {
            throw new BadRequestException('The file has not been uploaded')
        }

        const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif']
        const isFileFormatValid = validateFileFormat(filename, allowedFormats)

        if (!isFileFormatValid) {
            throw new BadRequestException('Unsupported file format')
        }

        let buffer: Buffer
        try {
            buffer = await readStreamWithSizeValidation(
                createReadStream(),
                this.MAX_FILE_SIZE_IN_MB,
            )
        } catch (error: any) {
            throw new BadRequestException(
                'Failed to process the file: ' + error.message,
            )
        }

        const isContentSafe =
            await this.contentModerationService.validateContent({
                image: buffer,
            })

        if (!isContentSafe) {
            throw new BadRequestException(
                'The image contains inappropriate content',
            )
        }

        upload.file.buffer = buffer

        return upload
    }
}
