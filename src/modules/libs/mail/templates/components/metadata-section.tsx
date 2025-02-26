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
        <Section className={`rounded-lg p-6 mb-6`}>
            <Heading
                className={`text-xl font-semibold text-[${TEMPLATE_COLORS.secondary}]`}
            >
                Данные запроса:
            </Heading>

            <MetadataList metadata={transformMetadata(metadata)} />

            <Text className={`text-[${TEMPLATE_COLORS.secondary}] mt-2`}>
                Если Вы не инициировали этот запрос, пожалуйста, проигнорируйте
                это сообщение.
            </Text>
        </Section>
    )
}
