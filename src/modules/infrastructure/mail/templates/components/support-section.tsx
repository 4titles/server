import * as React from 'react'

import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import { Link, Section, Text } from '@react-email/components'
import { TEMPLATE_COLORS } from '../constants/colors.constants'

interface SupportSectionProps {
    companyName?: string
    supportEmail?: string
}

export const SupportSection = ({
    companyName = COMPANY_NAME,
    supportEmail = COMPANY_SUPPORT_EMAIL,
}: SupportSectionProps) => {
    return (
        <Section
            style={{
                textAlign: 'center',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: `1px solid ${TEMPLATE_COLORS.divider}`,
            }}
        >
            <Text
                style={{
                    fontSize: '14px',
                    lineHeight: '24px',
                    color: TEMPLATE_COLORS.textSecondary,
                    margin: '0 0 8px 0',
                }}
            >
                Если у вас возникли вопросы или трудности при работе с
                платформой <strong>{companyName}</strong>, пожалуйста,
                обратитесь в службу поддержки:
            </Text>
            <Link
                href={`mailto:${supportEmail}`}
                style={{
                    color: TEMPLATE_COLORS.primary,
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'underline',
                }}
                target="_blank"
            >
                {supportEmail}
            </Link>
        </Section>
    )
}
