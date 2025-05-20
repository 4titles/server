import * as React from 'react'

import { SessionMetadata } from '@/shared/types/session-metadata.types'
import { Heading, Section, Text } from '@react-email/components'
import { TEMPLATE_COLORS } from '../constants/colors.constants'
import { transformMetadata } from '../utils/transform-metadata.util'
import { MetadataList } from './metadata-list'

interface MetadataSectionProps {
    metadata: SessionMetadata
}

export const MeatadataSection = ({ metadata }: MetadataSectionProps) => {
    return (
        <Section
            style={{
                backgroundColor: TEMPLATE_COLORS.background,
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '28px',
                marginTop: '8px',
                borderLeft: `3px solid ${TEMPLATE_COLORS.primary}`,
                WebkitBorderRadius: '8px',
                MozBorderRadius: '8px',
            }}
        >
            <Heading
                style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    margin: '0 0 16px 0',
                    padding: 0,
                    color: TEMPLATE_COLORS.foreground,
                }}
            >
                Данные запроса:
            </Heading>

            <MetadataList metadata={transformMetadata(metadata)} />

            <Text
                style={{
                    color: TEMPLATE_COLORS.textSecondary,
                    fontSize: '14px',
                    margin: '16px 0 0 0',
                    lineHeight: '22px',
                    fontStyle: 'italic',
                }}
            >
                Если вы не инициировали этот запрос, пожалуйста, проигнорируйте
                это сообщение.
            </Text>
        </Section>
    )
}
