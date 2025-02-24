import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components'
import * as React from 'react'
import { SupportSection } from './components/support-section'
import { TEMPLATE_COLORS } from './constants/colors.constants'

interface VerificationTemplateProps {
    domain: string
    token: string
    companyName?: string
    supportEmail?: string
}

export const VerificationTemplate = ({
    domain,
    token,
    companyName = COMPANY_NAME,
    supportEmail = COMPANY_SUPPORT_EMAIL,
}: VerificationTemplateProps) => {
    const verificationLink = `${domain}/account/verify?token=${token}`

    return (
        <Html lang="ru">
            <Head />
            <Preview>Подтвердите ваш email-адрес в {companyName}</Preview>
            <Tailwind>
                <Body className="bg-white">
                    <Container className="max-w-3xl mx-auto my-8">
                        <Section
                            className={`bg-[${TEMPLATE_COLORS.primary}] p-8 rounded-lg shadow-lg`}
                        >
                            {/* Header Section */}
                            <Section className="text-center mb-8">
                                <Heading
                                    className={`text-[${TEMPLATE_COLORS.secondary}] text-2xl font-bold m-0`}
                                >
                                    Подтверждение email-адреса
                                </Heading>
                            </Section>

                            {/* Main Content */}
                            <Section className="text-center mb-8">
                                <Text
                                    className={`text-[${TEMPLATE_COLORS.secondary}] text-base leading-6 mb-6`}
                                >
                                    Благодарим вас за регистрацию на платформе{' '}
                                    <strong>{companyName}</strong>! Для
                                    подтверждения адреса электронной почты
                                    нажмите на кнопку ниже:
                                </Text>

                                <Button
                                    href={verificationLink}
                                    className={`inline-flex justify-center items-center rounded-full text-sm font-bold text-[${TEMPLATE_COLORS.secondary}] bg-[${TEMPLATE_COLORS.accent}] px-5 py-2`}
                                >
                                    Подтвердить email
                                </Button>
                            </Section>

                            <Hr className="my-[16px] border-t-2 border-gray-300" />

                            {/* Support Section */}
                            <SupportSection
                                companyName={companyName}
                                supportEmail={supportEmail}
                            />
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}
