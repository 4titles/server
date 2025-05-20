import * as React from 'react'

import { Heading, Section, Text } from '@react-email/components'
import { TEMPLATE_COLORS } from '../constants/colors.constants'

interface HeaderProps {
    title: string
    description?: string
}

export const Header = ({ title, description }: HeaderProps) => {
    return (
        <Section
            style={{
                textAlign: 'center',
                marginBottom: '24px',
                padding: 0,
            }}
        >
            <Heading
                style={{
                    color: TEMPLATE_COLORS.foreground,
                    fontSize: '24px',
                    fontWeight: 600,
                    lineHeight: '32px',
                    margin: 0,
                    marginBottom: description ? '12px' : 0,
                    padding: 0,
                    textAlign: 'center',
                }}
            >
                {title}
            </Heading>

            {description && (
                <Text
                    style={{
                        color: TEMPLATE_COLORS.textPrimary,
                        fontSize: '16px',
                        lineHeight: '24px',
                        margin: 0,
                        padding: 0,
                        textAlign: 'center',
                    }}
                >
                    {description}
                </Text>
            )}
        </Section>
    )
}
