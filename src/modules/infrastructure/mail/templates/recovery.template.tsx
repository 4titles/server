import * as React from 'react'

import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import type { SessionMetadata } from '@/shared/types/session-metadata.types'
import { Section, Text } from '@react-email/components'
import { BaseTemplate } from './base-template'
import { Header } from './components/header'
import { MailButton } from './components/mail-button'
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
        <BaseTemplate
            preview={`Сброс пароля ${companyName}`}
            companyName={companyName}
        >
            <Header
                title="Сброс пароля"
                description="Вы запросили восстановление доступа к своему аккаунту"
            />

            <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Text
                    style={{
                        fontSize: '16px',
                        color: TEMPLATE_COLORS.textPrimary,
                        lineHeight: '24px',
                        margin: '0 0 16px 0',
                        textAlign: 'center',
                    }}
                >
                    Для создания нового пароля для вашей учётной записи на
                    платформе <strong>{companyName}</strong>, пожалуйста,
                    нажмите на кнопку ниже:
                </Text>

                <div style={{ textAlign: 'center' }}>
                    <MailButton href={resetLink} align="center">
                        Сбросить пароль
                    </MailButton>
                </div>

                <Text
                    style={{
                        fontSize: '14px',
                        color: TEMPLATE_COLORS.textSecondary,
                        lineHeight: '21px',
                        margin: '16px 0 0 0',
                        textAlign: 'center',
                    }}
                >
                    Ссылка действительна в течение 30 минут.
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
