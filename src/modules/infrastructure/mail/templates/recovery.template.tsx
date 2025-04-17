import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import type { SessionMetadata } from '@/shared/types/session-metadata.types'
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
import { MeatadataSection } from './components/metadata-section'
import { SupportSection } from './components/support-section'
import { TEMPLATE_COLORS } from './constants/colors.constants'

interface RecoveryTemplateProps {
    domain: string
    token: string
    metadata: SessionMetadata
    companyName?: string
    supportEmail?: string
}

export const RecoveryTemplate = ({
    domain,
    token,
    metadata,
    companyName = COMPANY_NAME,
    supportEmail = COMPANY_SUPPORT_EMAIL,
}: RecoveryTemplateProps) => {
    const resetLink = `${domain}/account/recovery/${token}`

    return (
        <Html lang="ru">
            <Head />
            <Preview>Сброс пароля {companyName}</Preview>
            <Tailwind>
                <Body>
                    <Container className="max-w-3xl mx-auto my-8">
                        <Section
                            className={`bg-[${TEMPLATE_COLORS.primary}] p-8 rounded-lg shadow-lg`}
                        >
                            {/* Header Section */}
                            <HeaderSection title="Сброс пароля" />

                            {/* Main Content */}
                            <Section className="text-center mb-8">
                                <Text
                                    className={`text-[${TEMPLATE_COLORS.secondary}] text-base mt-2`}
                                >
                                    Вы запросили сброс пароля для вашей учётной
                                    записи на платформе <b>{companyName}</b>.
                                </Text>

                                <Text
                                    className={`text-[${TEMPLATE_COLORS.secondary}] text-base mt-2`}
                                >
                                    Для создания нового пароля нажмите на кнопку
                                    ниже:
                                </Text>

                                <Button
                                    href={resetLink}
                                    className={`inline-flex justify-center items-center rounded-full text-sm font-bold text-[${TEMPLATE_COLORS.secondary}] bg-[${TEMPLATE_COLORS.accent}] px-5 py-2`}
                                >
                                    Сбросить пароль
                                </Button>
                            </Section>

                            <Hr className="my-[16px] border-t-2 border-gray-300" />

                            {/* Metadata section */}
                            <MeatadataSection metadata={metadata} />

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
