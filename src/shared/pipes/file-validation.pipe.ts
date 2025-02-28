import {
    BadRequestException,
    Injectable,
    type PipeTransform,
} from '@nestjs/common'
import { validateFileFormat } from '../utils/file.util'

@Injectable()
export class FileValidationPipe implements PipeTransform {
    public async transform(value: any) {
        const upload = Array.isArray(value) ? value[0] : value

        if (!upload || !upload.file) {
            throw new BadRequestException(
                'The file has not been uploaded properly',
            )
        }

        const { filename } = upload.file

        if (!filename) {
            throw new BadRequestException('The file has not been uploaded')
        }

        const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif']
        const isFileFormatValid = validateFileFormat(filename, allowedFormats)

        if (!isFileFormatValid) {
            throw new BadRequestException('Unsupported file format')
        }

        return upload
    }
}
