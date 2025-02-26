import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import type { SessionMetadata } from '@/shared/types/session-metadata.types'
import {
    Body,
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
import { HeaderSection } from './components/header-section'
import { MeatadataSection } from './components/metadata-section'
import { SupportSection } from './components/support-section'
import { TEMPLATE_COLORS } from './constants/colors.constants'

interface DeactivationTemplateProps {
    token: string
    metadata: SessionMetadata
    companyName?: string
    supportEmail?: string
}

export const DeactiveTemplate = ({
    token,
    metadata,
    companyName = COMPANY_NAME,
    supportEmail = COMPANY_SUPPORT_EMAIL,
}: DeactivationTemplateProps) => {
    return (
        <Html lang="ru">
            <Head />
            <Preview>Деактивация аккаунта {companyName}</Preview>
            <Tailwind>
                <Body>
                    <Container className="max-w-3xl mx-auto my-8">
                        <Section
                            className={`bg-[${TEMPLATE_COLORS.primary}] p-8 rounded-lg shadow-lg`}
                        >
                            {/* Header Section */}
                            <HeaderSection title="Деактивация аккаунта" />

                            {/* Main Content */}
                            <Section className="text-center mb-8">
                                <Text
                                    className={`text-[${TEMPLATE_COLORS.secondary}] text-base mt-2`}
                                >
                                    Вы запроси деактивацию своего аккаунта на
                                    платформе <b>{companyName}</b>.
                                </Text>
                            </Section>

                            <Section className="bg-gray-100 rounded-lg p-6 text-center mb-6">
                                <Heading className="text-2xl text-black font-semibold">
                                    Код подтверждения:
                                </Heading>
                                <Heading className="text-3xl text-black font-bold">
                                    {token}
                                </Heading>
                                <Text>
                                    Код является действительным в течение 5
                                    минут.
                                </Text>
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
