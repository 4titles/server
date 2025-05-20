import * as React from 'react'

import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import { Section, Text } from '@react-email/components'
import { BaseTemplate } from './base-template'
import { Header } from './components/header'
import { MailButton } from './components/mail-button'
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
        <BaseTemplate
            preview={`Подтвердите ваш email-адрес в ${companyName}`}
            companyName={companyName}
        >
            <Header
                title="Подтверждение email-адреса"
                description={`Благодарим вас за регистрацию в ${companyName}!`}
            />

            <Section style={{ marginBottom: '24px', textAlign: 'center' }}>
                <Text
                    style={{
                        fontSize: '16px',
                        color: TEMPLATE_COLORS.textPrimary,
                        lineHeight: '24px',
                        margin: '0 0 16px 0',
                        textAlign: 'center',
                    }}
                >
                    Для завершения регистрации и подтверждения адреса
                    электронной почты, пожалуйста, нажмите на кнопку ниже:
                </Text>

                <div style={{ textAlign: 'center' }}>
                    <MailButton href={verificationLink} align="center">
                        Подтвердить email
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
                    Если вы не регистрировались в {companyName}, просто
                    проигнорируйте это письмо.
                </Text>

                <Text
                    style={{
                        fontSize: '13px',
                        color: TEMPLATE_COLORS.textSecondary,
                        fontStyle: 'italic',
                        margin: '12px 0 0 0',
                        textAlign: 'center',
                    }}
                >
                    Ссылка действительна в течение 24 часов.
                </Text>
            </Section>

            <SupportSection
                companyName={companyName}
                supportEmail={supportEmail}
            />
        </BaseTemplate>
    )
}
