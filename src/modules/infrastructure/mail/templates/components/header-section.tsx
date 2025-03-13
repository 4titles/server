import { Heading, Section } from '@react-email/components'
import * as React from 'react'
import { TEMPLATE_COLORS } from '../constants/colors.constants'

interface HeaderSectionProps {
    title: string
}

export const HeaderSection = ({ title }: HeaderSectionProps) => {
    return (
        <Section className="text-center mb-8">
            <Heading
                className={`text-[${TEMPLATE_COLORS.secondary}] text-2xl font-bold m-0`}
            >
                {title}
            </Heading>
        </Section>
    )
}
