import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components'
import * as React from 'react'

export const COLORS = {
    primary: '#0d1926',
    secondary: '#e4e5e7',
    muted: '#848990',
    accent: '#466b95',
} as const

interface VerificationTemplateProps {
    domain: string
    token: string
    companyName?: string
    supportEmail?: string
}

export const VerificationTemplate = ({
    domain,
    token,
    companyName = '4Titles',
    supportEmail = 'help@4titles.ru',
}: VerificationTemplateProps) => {
    const verificationLink = `${domain}/account/verify?token=${token}`

    return (
        <Html lang="ru">
            <Head />
            <Preview>Подтвердите ваш email-адрес в {companyName}</Preview>
            <Tailwind>
                <Body className="bg-white">
                    <Container className="max-w-3xl mx-auto my-8">
                        <Section className="bg-[#0d1926] p-8 rounded-lg shadow-lg">
                            {/* Header Section */}
                            <Section className="text-center mb-8">
                                <Heading className="text-[#e4e5e7] text-2xl font-bold m-0">
                                    Подтверждение email-адреса
                                </Heading>
                            </Section>

                            {/* Main Content */}
                            <Section className="text-center mb-8">
                                <Text className="text-[#e4e5e7] text-base leading-6 mb-6">
                                    Благодарим вас за регистрацию на платформе{' '}
                                    <strong>{companyName}</strong>! Для
                                    подтверждения адреса электронной почты
                                    нажмите на кнопку ниже:
                                </Text>
                                <Button
                                    href={verificationLink}
                                    className="bg-[#466b95] text-[#e4e5e7] px-8 py-4 rounded-lg font-medium text-base no-underline inline-block font-bold"
                                >
                                    Подтвердить email
                                </Button>
                            </Section>

                            {/* Support Section */}
                            <Section className="text-center border-t border-[#243242]">
                                <Text className="text-[#848990] text-sm leading-6">
                                    Если у вас возникли вопросы или трудности
                                    при работе с платформой{' '}
                                    <strong>{companyName}</strong>, пожалуйста,
                                    обратитесь в службу поддержки:
                                </Text>
                                <Link
                                    href={`mailto:${supportEmail}`}
                                    className="text-[#848990] underline text-sm"
                                >
                                    {supportEmail}
                                </Link>
                            </Section>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}
