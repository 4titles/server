import * as React from 'react'

import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import type { SessionMetadata } from '@/shared/types/session-metadata.types'
import { Section, Text } from '@react-email/components'
import { BaseTemplate } from './base-template'
import { Header } from './components/header'
import { MeatadataSection } from './components/metadata-section'
import { SupportSection } from './components/support-section'
import { TEMPLATE_COLORS } from './constants/colors.constants'

interface DeactivationTemplateProps {
    token: string
    metadata: SessionMetadata
    companyName?: string
    supportEmail?: string
}

export const DeactivationTemplate = ({
    token,
    metadata,
    companyName = COMPANY_NAME,
    supportEmail = COMPANY_SUPPORT_EMAIL,
}: DeactivationTemplateProps) => {
    return (
        <BaseTemplate
            preview={`Деактивация аккаунта ${companyName}`}
            companyName={companyName}
        >
            <Header
                title="Деактивация аккаунта"
                description="Вы запросили деактивацию своего аккаунта"
            />

            <Section
                style={{
                    backgroundColor: TEMPLATE_COLORS.background,
                    padding: '20px',
                    marginBottom: '24px',
                    borderRadius: '8px',
                    textAlign: 'center',
                }}
            >
                <Text
                    style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: TEMPLATE_COLORS.foreground,
                        marginBottom: '12px',
                    }}
                >
                    Код подтверждения:
                </Text>
                <Text
                    style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: TEMPLATE_COLORS.foreground,
                        letterSpacing: '2px',
                        marginBottom: '12px',
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        display: 'inline-block',
                    }}
                >
                    {token}
                </Text>
                <Text
                    style={{
                        fontSize: '14px',
                        color: TEMPLATE_COLORS.mutedForeground,
                        marginTop: '8px',
                    }}
                >
                    Код является действительным в течение 5 минут.
                </Text>
            </Section>

            <MeatadataSection metadata={metadata} />

            <SupportSection
                companyName={companyName}
                supportEmail={supportEmail}
            />
        </BaseTemplate>
    )
}
