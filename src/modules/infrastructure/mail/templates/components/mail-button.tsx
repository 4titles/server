import * as React from 'react'

import { Button as EmailButton } from '@react-email/components'
import { TEMPLATE_COLORS } from '../constants/colors.constants'

export interface MailButtonProps {
    href: string
    children: React.ReactNode
    variant?: 'default' | 'secondary' | 'destructive'
    fullWidth?: boolean
    align?: 'left' | 'center' | 'right'
}

export const MailButton = ({
    href,
    children,
    variant = 'default',
    fullWidth = false,
    align = 'center',
}: MailButtonProps) => {
    const getButtonColors = () => {
        switch (variant) {
            case 'destructive':
                return {
                    background: TEMPLATE_COLORS.destructive,
                    color: TEMPLATE_COLORS.destructiveForeground,
                }
            case 'secondary':
                return {
                    background: TEMPLATE_COLORS.secondary,
                    color: TEMPLATE_COLORS.secondaryForeground,
                }
            default:
                return {
                    background: TEMPLATE_COLORS.primary,
                    color: TEMPLATE_COLORS.primaryForeground,
                }
        }
    }

    const { background, color } = getButtonColors()

    const marginLeft = align === 'left' ? '0' : 'auto'
    const marginRight = align === 'right' ? '0' : 'auto'

    return (
        <EmailButton
            href={href}
            style={{
                display: 'inline-block',
                backgroundColor: background,
                color: color,
                fontWeight: 500,
                fontSize: '15px',
                lineHeight: '100%',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                textAlign: 'center',
                cursor: 'pointer',
                width: fullWidth ? '100%' : undefined,
                maxWidth: fullWidth ? '100%' : '300px',
                margin: `16px ${marginRight} 16px ${marginLeft}`,
                WebkitBorderRadius: '6px',
                MozBorderRadius: '6px',
            }}
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </EmailButton>
    )
}
