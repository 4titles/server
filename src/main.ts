import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    const PORT = process.env.PORT || 3000
    await app.listen(PORT, () => {
        console.log(
            `Backend is running in ${process.env.NODE_ENV} mode. On Port: ${PORT}`,
        )
    })
}
bootstrap()
