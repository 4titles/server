import * as React from 'react'

import {
    COMPANY_DOMAIN,
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import { Section, Text } from '@react-email/components'
import { BaseTemplate } from './base-template'
import { Header } from './components/header'
import { MailButton } from './components/mail-button'
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
        <BaseTemplate
            preview={`Аккаунт ${companyName} был удалён`}
            companyName={companyName}
        >
            <Header
                title="Ваш аккаунт был удалён"
                description="Данные вашего аккаунта полностью удалены с платформы"
            />

            <Section style={{ marginBottom: '24px' }}>
                <Text
                    style={{
                        fontSize: '16px',
                        color: TEMPLATE_COLORS.textPrimary,
                        lineHeight: '24px',
                        margin: '0 0 16px 0',
                    }}
                >
                    Благодарим вас за то, что приняли участие в развитии
                    платформы! С текущего момента вы больше не будете получать
                    уведомления на почту или телеграм.
                </Text>

                <Text
                    style={{
                        fontSize: '16px',
                        color: TEMPLATE_COLORS.textPrimary,
                        lineHeight: '24px',
                        margin: '0 0 20px 0',
                    }}
                >
                    Информация и данные вашего аккаунта не подлежат
                    восстановлению.
                </Text>
            </Section>

            <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Text
                    style={{
                        fontSize: '16px',
                        color: TEMPLATE_COLORS.textSecondary,
                        marginBottom: '16px',
                        textAlign: 'center',
                    }}
                >
                    Если вы захотите вернуться в число пользователей платформы,
                    вы можете создать аккаунт повторно:
                </Text>

                <div style={{ textAlign: 'center' }}>
                    <MailButton href={accountCreationLink} align="center">
                        Зарегистрироваться
                    </MailButton>
                </div>
            </Section>

            <SupportSection
                companyName={companyName}
                supportEmail={supportEmail}
            />
        </BaseTemplate>
    )
}
