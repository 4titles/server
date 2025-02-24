import {
    COMPANY_NAME,
    COMPANY_SUPPORT_EMAIL,
} from '@/shared/constants/company.constants'
import { Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { TEMPLATE_COLORS } from '../constants/colors.constants'

interface Props {
    companyName?: string
    supportEmail?: string
}

export const SupportSection = ({
    companyName = COMPANY_NAME,
    supportEmail = COMPANY_SUPPORT_EMAIL,
}: Props) => {
    return (
        <Section className="text-center border-t border-[#243242]">
            <Text
                className={`text-[${TEMPLATE_COLORS.muted}] text-sm leading-6`}
            >
                Если у вас возникли вопросы или трудности при работе с
                платформой <strong>{companyName}</strong>, пожалуйста,
                обратитесь в службу поддержки:
            </Text>
            <Link
                href={`mailto:${supportEmail}`}
                className={`text-[${TEMPLATE_COLORS.muted}] underline text-sm`}
            >
                {supportEmail}
            </Link>
        </Section>
    )
}
