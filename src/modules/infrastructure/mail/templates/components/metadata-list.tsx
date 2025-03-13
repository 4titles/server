import * as React from 'react'
import { TEMPLATE_COLORS } from '../constants/colors.constants'
import type { TransformedLocationInfo } from '../utils/transform-metadata.util'

interface MetadataListProps {
    metadata: TransformedLocationInfo
}

export const MetadataList = ({ metadata }: MetadataListProps) => {
    const items = [
        { label: 'Расположение', value: metadata.location },
        { label: 'ОС', value: metadata.os },
        { label: 'Браузер', value: metadata.browser },
        { label: 'Устройство', value: metadata.device },
        { label: 'IP-адрес', value: metadata.ip },
    ].filter((item) => item.value !== null)

    return (
        <ul className="list-disc list-inside mt-2">
            {items.map(({ label, value }) => (
                <li
                    key={label}
                    className={`text-[${TEMPLATE_COLORS.secondary}]`}
                >
                    <b>{label}: </b>
                    {value}
                </li>
            ))}
        </ul>
    )
}
