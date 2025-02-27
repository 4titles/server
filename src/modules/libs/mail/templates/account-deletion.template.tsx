import {
    COMPANY_DOMAIN,
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components'
import * as React from 'react'
import { HeaderSection } from './components/header-section'
import { SupportSection } from './components/support-section'
import { TEMPLATE_COLORS } from './constants/colors.constants'

interface AccountDeletionTemplateProps {
    companyName?: string
    supportEmail?: string
    domain?: string
}

export const AccountDeletionTemplate = ({
    companyName = COMPANY_NAME,
    supportEmail = COMPANY_SUPPORT_EMAIL,
    domain = COMPANY_DOMAIN,
}: AccountDeletionTemplateProps) => {
    const accountCreationLink = `https://${domain}/account/create`

    return (
        <Html lang="ru">
            <Head />
            <Preview>Аккаунт {companyName} был удалён</Preview>
            <Tailwind>
                <Body className="bg-white">
                    <Container className="max-w-3xl mx-auto my-8">
                        <Section
                            className={`bg-[${TEMPLATE_COLORS.primary}] p-8 rounded-lg shadow-lg`}
                        >
                            {/* Header Section */}
                            <HeaderSection title="Ваш аккаунт был удалён" />

                            <Text
                                className={`text-[${TEMPLATE_COLORS.secondary}] text-base mt-2`}
                            >
                                Ваш аккаунт был полностью удалён с платформы{' '}
                                {companyName}. Информация и данные не подлежат
                                восстановлению.
                            </Text>

                            {/* Main Content */}
                            <Section className="text-center p-6 mb-4">
                                <Text
                                    className={`text-[${TEMPLATE_COLORS.secondary}] text-base leading-6 mb-6`}
                                >
                                    Благодарим вас за то, что приняли участие в
                                    развитии платформы! С текущего моменты Вы
                                    больше не будете получения уведомления на
                                    почту или телеграм.
                                </Text>

                                <Text
                                    className={`text-[${TEMPLATE_COLORS.muted}] text-base leading-6 mb-6`}
                                >
                                    Если Вы захотите вернуться в число
                                    пользователей платформы, то Вы можете
                                    создать аккаунт повторно, кликнув на кнопку
                                    ниже:
                                </Text>

                                <Button
                                    href={accountCreationLink}
                                    className={`inline-flex justify-center items-center rounded-full text-sm font-bold text-[${TEMPLATE_COLORS.secondary}] bg-[${TEMPLATE_COLORS.accent}] px-5 py-2`}
                                >
                                    Зарегестрироваться
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
